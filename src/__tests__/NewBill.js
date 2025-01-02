/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then mail icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);
      await waitFor(() => screen.getByTestId("icon-mail"));
      const mailIcon = screen.getByTestId("icon-mail");
      expect(mailIcon.classList.contains("active-icon")).toBe(true);
    });

    describe("When I upload a file", () => {
      test("Then I add a file", () => {
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: localStorageMock,
        });

        const handleChangeFile = jest.fn(newBill.handleChangeFile);
        const inputFile = screen.getByTestId("file");
        inputFile.addEventListener("change", handleChangeFile);
        fireEvent.change(inputFile, {
          target: {
            files: [
              new File(["document.jpg"], "document.jpg", {
                type: "document/jpg",
              }),
            ],
          },
        });

        expect(handleChangeFile).toHaveBeenCalled();
        expect(handleChangeFile).toBeCalled();
        expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
      });

      describe("NewBill File Upload", () => {
        test("should upload file and update bill properties", async () => {
          const mockFile = new File(["test"], "test.jpg", {
            type: "image/jpeg",
          });

          const mockStore = {
            bills: jest.fn().mockReturnValue({
              create: jest.fn().mockResolvedValue({
                fileUrl: "http://example.com/uploaded-file.jpg",
                key: "unique-bill-key",
              }),
            }),
          };

          const mockLocalStorage = {
            getItem: jest
              .fn()
              .mockReturnValue(JSON.stringify({ email: "test@example.com" })),
          };

          const newBill = new NewBill({
            document,
            onNavigate: jest.fn(),
            store: mockStore,
            localStorage: mockLocalStorage,
          });

          const event = {
            preventDefault: jest.fn(),
            target: {
              value: "C:\\fakepath\\test.jpg",
              files: [mockFile],
            },
          };

          await newBill.handleChangeFile(event);

          expect(mockStore.bills().create).toHaveBeenCalledWith({
            data: expect.any(FormData),
            headers: { noContentType: true },
          });

          expect(newBill.billId).toBe("unique-bill-key");
          expect(newBill.fileUrl).toBe("http://example.com/uploaded-file.jpg");
          expect(newBill.fileName).toBe("test.jpg");
        });
      });
    });

    describe("When I submit form", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });

      describe("When submit form valid", () => {
        test("Then call the api updates the bills", async () => {
          const newBill = new NewBill({
            document,
            onNavigate,
            store: mockStore,
            localStorage: localStorageMock,
          });
          const handleSubmit = jest.fn(newBill.handleSubmit);
          const form = screen.getByTestId("form-new-bill");
          form.addEventListener("submit", handleSubmit);
          fireEvent.submit(form);
          expect(mockStore.bills).toHaveBeenCalled();
        });
      });
    });
  });
});
