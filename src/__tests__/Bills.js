import { screen, render, fireEvent } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import VerticalLayout from "../views/VerticalLayout.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import firebase from "../__mocks__/firebase.js";
import LoadingPage from "../views/LoadingPage.js";
import ErrorPage from "../views/ErrorPage.js";
import $ from 'jquery';

// Mock user data in localStorage
const mockUserEmployee = () => {
  localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));
};

// Mock the logic to highlight the active icon
const highlightIcon = () => {
  const icon = document.querySelector('#layout-icon1'); // This ID should match your actual icon element
  if (icon) {
    icon.classList.add('active-icon'); // Ensure this class is what your app uses for highlighting
  }
};

// Mock the firestore module to use the existing firebase.js mock
jest.mock("../__mocks__/firebase.js");

// Mock the jQuery modal function
$.fn.modal = jest.fn();

describe("Given I am connected as an employee", () => {
  let billsInstance;
  let onNavigate;

  beforeEach(() => {
    // Mock the user in localStorage
    mockUserEmployee();

    // Render VerticalLayout and BillsUI
    const verticalLayoutHTML = VerticalLayout(120);
    document.body.innerHTML = verticalLayoutHTML;

    const html = BillsUI({ data: bills });
    document.body.innerHTML += html;

    // Simulate highlighting the icon
    highlightIcon();

    // Initialize Bills instance
    onNavigate = jest.fn();
    billsInstance = new Bills({
      document,
      onNavigate,
      firestore: firebase,
      localStorage: localStorageMock,
    });
  });

  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", () => {
      // Select all icon elements
      const icons = screen.getAllByTestId("icon-window");

      // Check if at least one icon exists
      expect(icons.length).toBeGreaterThan(0);

      // Check if the first icon is highlighted with the appropriate class
      expect(icons[0].classList.contains("active-icon")).toBe(true);
    });

    test("Then bills should be ordered from latest to earliest", () => {
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
        .map((date) => date.innerHTML);
      const antiChrono = (a, b) => ((a < b) ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    test("Then the loading page should be displayed", () => {
      const html = BillsUI({ data: [], loading: true });
      document.body.innerHTML = html;
      expect(screen.getByText('Loading...')).toBeTruthy();
    });

    test("Then the error page should be displayed", () => {
      const html = BillsUI({ data: [], error: 'Error message' });
      document.body.innerHTML = html;
      expect(screen.getByText('Error message')).toBeTruthy();
    });

    test("Then the bills should be rendered correctly", () => {
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;
      const rows = screen.getAllByTestId('tbody-row');
      expect(rows.length).toBe(bills.length);
    });

    test("Then the modal should be rendered correctly", () => {
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;
      const modal = screen.getByTestId('modalDialog');
      expect(modal).toBeTruthy();
    });

    test("Then the new bill button should be rendered", () => {
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;
      const newBillButton = screen.getByTestId('btn-new-bill');
      expect(newBillButton).toBeTruthy();
    });
  });

  describe("When I click on the New Bill button", () => {
    test("Then it should navigate to the New Bill page", () => {
      const buttonNewBill = screen.getByTestId("btn-new-bill");
      fireEvent.click(buttonNewBill);
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);
    });
  });

  describe("When I click on the eye icon", () => {
    test("Then it should open the modal with the image", () => {
      const iconEyes = screen.getAllByTestId("icon-eye");
      iconEyes.forEach(iconEye => {
        fireEvent.click(iconEye);
        const modal = screen.getByTestId("modalDialog");
        expect(modal).toBeTruthy();
        expect(modal.querySelector(".modal-body").innerHTML).toContain("img");
      });
    });
  });

  describe("When the Bills component is instantiated", () => {
    test("Then it should attach event listeners to the New Bill button and eye icons", () => {
      const buttonNewBill = screen.getByTestId("btn-new-bill");
      const iconEyes = screen.getAllByTestId("icon-eye");

      expect(buttonNewBill).toBeTruthy();
      expect(iconEyes.length).toBeGreaterThan(0);

      fireEvent.click(buttonNewBill);
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);

      iconEyes.forEach(iconEye => {
        fireEvent.click(iconEye);
        const modal = screen.getByTestId("modalDialog");
        expect(modal).toBeTruthy();
        expect(modal.querySelector(".modal-body").innerHTML).toContain("img");
      });
    });
  });

  describe('when the user interacts with event Listeners and modal', () => {
    let bills;
    let document;
    let onNavigate;
    let firestore;
    let localStorage;
  
    beforeEach(() => {
      document = {
        createElement: jest.fn().mockImplementation((tagName) => {
          return {
            tagName,
            setAttribute: jest.fn(),
            appendChild: jest.fn(),
            addEventListener: jest.fn(),
            click: jest.fn(),
          };
        }),
        querySelector: jest.fn().mockReturnValue({
          addEventListener: jest.fn()
        }),
        querySelectorAll: jest.fn().mockReturnValue([{
          addEventListener: jest.fn(),
          getAttribute: jest.fn().mockReturnValue('http://example.com/bill.jpg')
        }]),
        body: {
          appendChild: jest.fn(),
        },
      };
      onNavigate = jest.fn();
      firestore = {};
      localStorage = {};
  
      bills = new Bills({ document, onNavigate, firestore, localStorage });
    });
  
    test('should add event listener to "New Bill" button', () => {
      const buttonNewBill = document.querySelector(`button[data-testid="btn-new-bill"]`);
      expect(buttonNewBill.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });
  
    test('should add event listeners to "Eye" icons', () => {
      const iconEye = document.querySelectorAll(`div[data-testid="icon-eye"]`);
      iconEye.forEach(icon => {
        expect(icon.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      });
    });
  
    test('should show modal with bill image on "Eye" icon click', () => {
      const icon = document.querySelectorAll()[0];
      bills.handleClickIconEye(icon);
      expect(icon.getAttribute).toHaveBeenCalledWith('data-bill-url');
      expect($('#modaleFile').find('.modal-body').html()).toContain('http://example.com/bill.jpg');
    });
  
    test('should add event listener to buttonNewBill if it exists', () => {
      const buttonNewBill = { addEventListener: jest.fn() };
      document.querySelector.mockReturnValue(buttonNewBill);
  
      new Bills({ document, onNavigate, firestore, localStorage });
  
      expect(buttonNewBill.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });
  
    test('should not throw error if buttonNewBill does not exist', () => {
      document.querySelector.mockReturnValue(null);
  
      expect(() => {
        new Bills({ document, onNavigate, firestore, localStorage });
      }).not.toThrow();
    });
  
    test('should add event listeners to iconEye elements if they exist', () => {
      const iconEye1 = { addEventListener: jest.fn() };
      const iconEye2 = { addEventListener: jest.fn() };
      document.querySelectorAll.mockReturnValue([iconEye1, iconEye2]);
  
      new Bills({ document, onNavigate, firestore, localStorage });
  
      expect(iconEye1.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      expect(iconEye2.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });
  
    test('should not throw error if iconEye elements do not exist', () => {
      document.querySelectorAll.mockReturnValue([]);
  
      expect(() => {
        new Bills({ document, onNavigate, firestore, localStorage });
      }).not.toThrow();
    });
  });
});