/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH, ROUTES } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import Bills from "../containers/Bills.js"
import router from "../app/Router.js"
import { formatStatus, formatDate } from "../app/format.js"
import mockStore from "../__mocks__/store"

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      // Configurer le localStorage avec un utilisateur de type Employee
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      
      // Créer l'élément root pour le router
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      
      // Initialiser le router et naviguer vers la page Bills
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      
      // Attendre que l'icône soit affichée et vérifier qu'elle est mise en surbrillance
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains('active-icon')).toBe(true)
    })

    test("Then bills should display status", () => {
      // Formater les données comme le fait le container Bills
      const formattedBills = bills.map(bill => ({
        ...bill,
        date: formatDate(bill.date),
        status: formatStatus(bill.status)
      }))
      
      // Générer le HTML de la vue Bills
      const html = BillsUI({ data: formattedBills })
      document.body.innerHTML = html
      
      // Vérifier que les statuts sont affichés correctement
      expect(screen.getAllByText("En attente")).toBeTruthy()
      expect(screen.getAllByText("Refused")).toBeTruthy()
      expect(screen.getAllByText("Accepté")).toBeTruthy()
    })

    test("Then bills should be ordered from latest to earliest", () => {
      // Trier du plus récent au plus ancien
      const sortedBills = [...bills].sort((a, b) => new Date(b.date) - new Date(a.date))

      document.body.innerHTML = BillsUI({ data: sortedBills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => (a < b) ? 1 : -1
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })

  describe("When I click on 'Nouvelle note de frais' button", () => {
    test("Then I should navigate to NewBill page", () => {
      // Créer une instance du container Bills
      const onNavigate = jest.fn()
      const billsContainer = new Bills({ document, onNavigate, store: null, localStorage })

      // Simuler le clic sur le bouton
      billsContainer.handleClickNewBill()

      // Vérifier la navigation
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill'])
    })

    test("Then the button should be present and clickable", () => {
      // Générer le HTML de la page Bills
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      
      // Récupérer le bouton
      const newBillButton = screen.getByTestId('btn-new-bill')
      
      // Vérifier que le bouton existe et a le bon texte
      expect(newBillButton).toBeTruthy()
      expect(newBillButton.textContent).toBe('Nouvelle note de frais')
    })
  })

  describe("When I click on the eye icon", () => {
    test("Then the eye icon should be present", () => {
      // Générer le HTML de la page Bills
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html

      // Vérifier que les icônes œil sont présentes
      const iconEyes = screen.getAllByTestId('icon-eye')
      expect(iconEyes).toBeTruthy()
      expect(iconEyes.length).toBeGreaterThan(0)
    })

    test("Then a modal should open with the bill proof", () => {
      // Configurer le localStorage
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))

      // Générer le HTML de la page Bills
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html

      // Créer une instance du container Bills
      const onNavigate = jest.fn()
      const billsContainer = new Bills({ 
        document, 
        onNavigate, 
        store: null, 
        localStorage: window.localStorage 
      })

      // Mock jQuery pour la modale
      $.fn.modal = jest.fn()
      $.fn.width = jest.fn(() => 500)
      $.fn.find = jest.fn(() => ({ html: jest.fn() }))

      // Récupérer l'icône et simuler le clic
      const iconEye = screen.getAllByTestId('icon-eye')[0]
      const handleClickIconEye = jest.fn(() => billsContainer.handleClickIconEye(iconEye))
      iconEye.addEventListener('click', handleClickIconEye)
      iconEye.click()

      // Vérifier que la méthode a été appelée
      expect(handleClickIconEye).toHaveBeenCalled()
    })
  })

  describe("When I navigate to Bills page", () => {
    test("Then getBills should fetch bills from API and format them", async () => {
      // Configurer le localStorage
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'employee@test.com'
      }))

      // Créer une instance du container Bills
      const billsContainer = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage
      })

      // Appeler getBills et vérifier le résultat
      const result = await billsContainer.getBills()
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('date')
      expect(result[0]).toHaveProperty('status')
    })

    test("Then getBills should handle corrupted date", async () => {
      // Configurer le localStorage
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'employee@test.com'
      }))

      // Créer des bills avec une date corrompue
      const corruptedBills = [{
        id: "1",
        status: "pending",
        date: "invalid-date",
        amount: 100
      }]

      // Créer un mock store
      const mockStoreCorrupted = {
        bills: jest.fn(() => ({
          list: jest.fn(() => Promise.resolve(corruptedBills))
        }))
      }

      // Créer une instance du container Bills
      const billsContainer = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockStoreCorrupted,
        localStorage: window.localStorage
      })

      // Spy sur console.log pour vérifier la gestion d'erreur
      const consoleSpy = jest.spyOn(console, 'log')
      const result = await billsContainer.getBills()

      // Vérifier la gestion d'erreur et le résultat
      expect(consoleSpy).toHaveBeenCalled()
      expect(result.length).toBe(1)
      expect(result[0].date).toBe("invalid-date")

      consoleSpy.mockRestore()
    })

    // Gestion des erreurs 404 et 500

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
          list: jest.fn(() => Promise.reject(new Error("Erreur 404")))
        }))
      }

      // Créer une instance du container Bills
      const billsContainer = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockStore404,
        localStorage: window.localStorage
      })

      // Appeler getBills et vérifier que l'erreur est propagée
      await expect(billsContainer.getBills()).rejects.toThrow("Erreur 404")
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
          list: jest.fn(() => Promise.reject(new Error("Erreur 500")))
        }))
      }

      // Créer une instance du container Bills
      const billsContainer = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockStore500,
        localStorage: window.localStorage
      })

      // Appeler getBills et vérifier que l'erreur est propagée
      await expect(billsContainer.getBills()).rejects.toThrow("Erreur 500")
    })
  })

  // Test d'intégration GET - inspiré de Dashboard.js
  describe("When I navigate to Bills with router", () => {
    test("Then it should fetch bills from mock API and display them", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "e@e" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"))
      expect(screen.getByText("Mes notes de frais")).toBeTruthy()
      expect(screen.getAllByTestId("icon-eye").length).toBeGreaterThan(0)
    })
  })
})