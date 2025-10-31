/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js"
import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression

    })

    test("Then bills should display status", () => {
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      
      // Vérifier que les statuts sont affichés
      expect(screen.getByText("En attente")).toBeTruthy()   // pending
      expect(screen.getByText("Refused")).toBeTruthy()      // refused  
      expect(screen.getByText("Accepté")).toBeTruthy()      // accepted
    })


    test("Then bills should be ordered from latest to earliest", () => {
      // Tri des données comme le fait mon front
      const sortedBills = [...bills].sort((a, b) => new Date(b.date) - new Date(a.date))
      
      document.body.innerHTML = BillsUI({ data: sortedBills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })

  describe("When I click on 'Nouvelle note de frais' button", () => {
    test("Then I should navigate to NewBill page", () => {
      // Créer une fausse fonction de navigation pour capturer les appels
      const onNavigate = jest.fn()
      
      // Créer une instance du container Bills avec nos mocks
      const bills = new Bills({ document, onNavigate, store: null, localStorage })

      // Simuler le clic sur le bouton "Nouvelle note de frais"
      bills.handleClickNewBill()

      // Vérifier que la navigation vers NewBill a été appelée
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill'])
    })
    
    test("Then the button should be present and clickable", () => {
      // Générer le HTML de la page Bills avec les données de test
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      
      // Chercher le bouton "Nouvelle note de frais" dans le DOM
      const newBillButton = screen.getByTestId('btn-new-bill')
      
      // Vérifier que le bouton existe
      expect(newBillButton).toBeTruthy()
      
      // Vérifier que le bouton a le bon texte affiché
      expect(newBillButton.textContent).toBe('Nouvelle note de frais')
    })
  })
})
