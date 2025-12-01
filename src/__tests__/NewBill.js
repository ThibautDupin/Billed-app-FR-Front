/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then the form should be displayed with all required fields", () => {
      // Générer le HTML de la page NewBill
      const html = NewBillUI()
      document.body.innerHTML = html

      //AJOUT
      // Vérifier que le formulaire est présent
      expect(screen.getByTestId("form-new-bill")).toBeTruthy()
      
      // Vérifier que tous les champs requis sont présents
      expect(screen.getByTestId("expense-type")).toBeTruthy()
      expect(screen.getByTestId("expense-name")).toBeTruthy()
      expect(screen.getByTestId("datepicker")).toBeTruthy()
      expect(screen.getByTestId("amount")).toBeTruthy()
      expect(screen.getByTestId("vat")).toBeTruthy()
      expect(screen.getByTestId("pct")).toBeTruthy()
      expect(screen.getByTestId("commentary")).toBeTruthy()
      expect(screen.getByTestId("file")).toBeTruthy()
    })
// AJOUT
    test("Then I can fill in the form fields", () => {
      // Générer le HTML de la page NewBill
      const html = NewBillUI()
      document.body.innerHTML = html
      
      // Remplir les champs du formulaire
      const expenseType = screen.getByTestId("expense-type")
      fireEvent.change(expenseType, { target: { value: "Transports" } })
      expect(expenseType.value).toBe("Transports")
      
      const expenseName = screen.getByTestId("expense-name")
      fireEvent.change(expenseName, { target: { value: "Vol Paris Londres" } })
      expect(expenseName.value).toBe("Vol Paris Londres")
      
      const datepicker = screen.getByTestId("datepicker")
      fireEvent.change(datepicker, { target: { value: "2023-04-15" } })
      expect(datepicker.value).toBe("2023-04-15")
      
      const amount = screen.getByTestId("amount")
      fireEvent.change(amount, { target: { value: "348" } })
      expect(amount.value).toBe("348")
      
      const vat = screen.getByTestId("vat")
      fireEvent.change(vat, { target: { value: "70" } })
      expect(vat.value).toBe("70")
      
      const pct = screen.getByTestId("pct")
      fireEvent.change(pct, { target: { value: "20" } })
      expect(pct.value).toBe("20")
      
      const commentary = screen.getByTestId("commentary")
      fireEvent.change(commentary, { target: { value: "Voyage d'affaires" } })
      expect(commentary.value).toBe("Voyage d'affaires")
    })
  })
//AJOUT
  describe("When I submit a new bill", () => {
    test("Then it should call handleSubmit and navigate to Bills page", () => {
      // Configurer le localStorage
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'employee@test.com'
      }))
      
      // Générer le HTML de la page NewBill
      const html = NewBillUI()
      document.body.innerHTML = html
      
      // Créer une fonction de navigation mock
      const onNavigate = jest.fn()
      
      // Créer une instance du container NewBill
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage
      })
      
      // Spy sur la méthode handleSubmit
      const handleSubmit = jest.fn(newBill.handleSubmit)
      
      // Récupérer le formulaire et ajouter l'écouteur d'événement
      const form = screen.getByTestId("form-new-bill")
      form.addEventListener("submit", handleSubmit)
      
      // Soumettre le formulaire
      fireEvent.submit(form)
      
      // Vérifier que handleSubmit a été appelé
      expect(handleSubmit).toHaveBeenCalled()
    })
    //AJOUT

    test("Then it should create a bill with correct data and navigate to Bills", () => {
      // Configurer le localStorage
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'employee@test.com'
      }))
      
      // Générer le HTML
      const html = NewBillUI()
      document.body.innerHTML = html
      
      // Créer un mock de navigation
      const onNavigate = jest.fn()
      
      // Créer une instance de NewBill
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage
      })
      
      // Remplir le formulaire
      screen.getByTestId("expense-type").value = "Transports"
      screen.getByTestId("expense-name").value = "Vol Paris Londres"
      screen.getByTestId("datepicker").value = "2023-04-15"
      screen.getByTestId("amount").value = "348"
      screen.getByTestId("vat").value = "70"
      screen.getByTestId("pct").value = "20"
      screen.getByTestId("commentary").value = "Voyage d'affaires"
      
      // Soumettre le formulaire
      const form = screen.getByTestId("form-new-bill")
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
      form.addEventListener("submit", handleSubmit)
      fireEvent.submit(form)
      
      // Vérifier que la navigation vers Bills a été appelée
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills'])
    })

    // Test d'intégration POST
    test("Then it should create a new bill via POST to the API", async () => {
      const updateMock = jest.fn(() => Promise.resolve({ id: "1234", status: "pending" }))
      const mockStore = {
        bills: jest.fn(() => ({
          update: updateMock
        }))
      }

      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage
      })

      // Simuler les données d'une nouvelle note de frais
      const bill = {
        email: "employee@test.com",
        type: "Transports",
        name: "Vol Paris Londres",
        amount: 348,
        date: "2023-04-15",
        vat: "70",
        pct: 20,
        commentary: "Voyage d'affaires",
        fileUrl: "https://test.com/file.jpg",
        fileName: "test.jpg",
        status: "pending"
      }

      // Appeler updateBill pour créer la nouvelle note
      await newBill.updateBill(bill)

      // Vérifier que la méthode update du store a été appelée
      expect(updateMock).toHaveBeenCalled()
    })
  })
// AJOUT
  describe("When I upload a file", () => {
    test("Then handleChangeFile should be called", () => {
      // Configurer le localStorage
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'employee@test.com'
      }))
      
      // Générer le HTML
      const html = NewBillUI()
      document.body.innerHTML = html
      
      // Créer un mock store
      const mockStore = {
        bills: jest.fn(() => ({
          create: jest.fn(() => Promise.resolve({
            fileUrl: 'https://test.com/file.jpg',
            key: '1234'
          }))
        }))
      }
      
      // Créer une instance de NewBill
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage
      })
      
      // Spy sur handleChangeFile
      const handleChangeFile = jest.fn(newBill.handleChangeFile)
      
      // Récupérer l'input file
      const fileInput = screen.getByTestId("file")
      fileInput.addEventListener("change", handleChangeFile)
      
      // Simuler le changement de fichier
      fireEvent.change(fileInput, {
        target: {
          files: [new File(['test'], 'test.jpg', { type: 'image/jpg' })]
        }
      })
      
      // Vérifier que handleChangeFile a été appelé
      expect(handleChangeFile).toHaveBeenCalled()
    })
// AJOUT
    test("Then it should handle file upload error", async () => {
      // Configurer le localStorage
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'employee@test.com'
      }))
      
      // Générer le HTML
      const html = NewBillUI()
      document.body.innerHTML = html
      
      // Créer un mock store qui rejette la promesse
      const mockStore = {
        bills: jest.fn(() => ({
          create: jest.fn(() => Promise.reject(new Error('Upload error')))
        }))
      }
      
      // Spy sur console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      
      // Créer une instance de NewBill
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage
      })
      
      // Récupérer l'input file et créer un fichier
      const fileInput = screen.getByTestId("file")
      const file = new File(['test'], 'test.jpg', { type: 'image/jpg' })
      
      // Définir les propriétés pour simuler le fichier
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })
      
      // Simuler l'événement change avec le bon format
      const event = new Event('change', { bubbles: true })
      Object.defineProperty(event, 'target', {
        value: { value: 'C:\\fakepath\\test.jpg', files: [file] },
        writable: false
      })
      
      // Appeler directement handleChangeFile
      newBill.handleChangeFile(event)
      
      // Attendre que l'erreur soit traitée
      await new Promise(resolve => setTimeout(resolve, 0))
      
      // Vérifier que console.error a été appelé
      expect(consoleErrorSpy).toHaveBeenCalled()
      
      consoleErrorSpy.mockRestore()
    })
  })

  // Tests d'intégration - Erreurs API
  describe("When I upload a file and API fails", () => {
    test("Then it should handle 404 error", async () => {
      // Configurer le localStorage
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'employee@test.com'
      }))

      // Mock store avec erreur 404
      const mockStore404 = {
        bills: jest.fn(() => ({
          create: jest.fn(() => Promise.reject(new Error("Erreur 404")))
        }))
      }

      // Générer le HTML
      const html = NewBillUI()
      document.body.innerHTML = html

      // Créer une instance de NewBill
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore404,
        localStorage: window.localStorage
      })

      // Récupérer l'input file et créer un fichier
      const fileInput = screen.getByTestId("file")
      const file = new File(['test'], 'test.jpg', { type: 'image/jpg' })
      
      // Définir les propriétés pour simuler le fichier
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })

      // Spy sur console.error pour vérifier la gestion d'erreur
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      // Simuler l'événement change
      const event = new Event('change', { bubbles: true })
      Object.defineProperty(event, 'target', {
        value: { value: 'C:\\fakepath\\test.jpg', files: [file] },
        writable: false
      })

      // Appeler handleChangeFile
      newBill.handleChangeFile(event)

      // Attendre que l'erreur soit traitée
      await new Promise(resolve => setTimeout(resolve, 0))

      // Vérifier que l'erreur a été loggée
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    test("Then it should handle 500 error", async () => {
      // Configurer le localStorage
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'employee@test.com'
      }))

      // Mock store avec erreur 500
      const mockStore500 = {
        bills: jest.fn(() => ({
          create: jest.fn(() => Promise.reject(new Error("Erreur 500")))
        }))
      }

      // Générer le HTML
      const html = NewBillUI()
      document.body.innerHTML = html

      // Créer une instance de NewBill
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore500,
        localStorage: window.localStorage
      })

      // Récupérer l'input file et créer un fichier
      const fileInput = screen.getByTestId("file")
      const file = new File(['test'], 'test.jpg', { type: 'image/jpg' })
      
      // Définir les propriétés pour simuler le fichier
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })

      // Spy sur console.error pour vérifier la gestion d'erreur
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      // Simuler l'événement change
      const event = new Event('change', { bubbles: true })
      Object.defineProperty(event, 'target', {
        value: { value: 'C:\\fakepath\\test.jpg', files: [file] },
        writable: false
      })

      // Appeler handleChangeFile
      newBill.handleChangeFile(event)

      // Attendre que l'erreur soit traitée
      await new Promise(resolve => setTimeout(resolve, 0))

      // Vérifier que l'erreur a été loggée
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })
  })
})
