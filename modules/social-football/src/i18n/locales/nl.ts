import { HeaderTitle } from "react-navigation-stack";

export default {
    appName: 'Social.Football',
    login: {
        description: 'Log hier in met je Connected.Football account, of maak er een aan.',
        username: {
            label: 'Gebruikersnaam',
            placeholder: 'Vul hier je gebruikersnaam in',
        },
        password: {
            label: 'Wachtwoord',
            placeholder: 'Vul hier je wachtwoord in',
        },
        submit: {
            label: 'Inloggen',
        },
        register: {
            separator: 'of',
            link: 'Maak een account aan',
        },
        wrongCredentials: 'Deze combinatie van gebruikersnaam en wachtwoord klopt niet.',
    },
    register: {
        title: 'Registreren',
        description: 'Maak een account aan, en word lid van een team, of maak er zelf een aan!',
        firstName: {
            label: 'Voornaam',
            placeholder: 'Vul hier je voornaam in',
        },
        lastName: {
            label: 'Achternaam',
            placeholder: 'Vul hier je achternaam in',
        },
        email: {
            label: 'E-mailadres',
            placeholder: 'Vul hier je e-mailadres in',
        },
        username: {
            label: 'Gebruikersnaam',
            placeholder: 'Vul hier je gebruikersnaam in',
        },
        password: {
            label: 'Wachtwoord',
            placeholder: 'Vul hier je wachtwoord in',
        },
        submit: {
            label: 'Registreren',
        },
        error: 'Er ging iets mis bij het registreren.',
        login: {
            separator: 'of',
            link: 'Log in met een bestaand account',
        },
    },
    createThread: {
        title: 'Nieuwe thread',
        threadtitle: {
            label: 'Titel',
            placeholder: 'Item titel',
        },
        description: {
            label: 'Beschrijving',
            placeholder: 'Beschrijving item',
        },
        contentType: {
            label: 'Type item',
        },
        text: {
            label:'Tekst',
        },
        link: {
            label:'Link',
        },
        photo: {
            label:'Foto',
        },
        video: {
            label:'Video'
        },
        exercise: {
            label:'Oefening',
        },
        program: {
            label: 'Trainingsprogramma',
        },
        comment: {
            label: 'Opmerkingen',
        },
        categoricalResponse: {
            label: 'Suggesties',
        }
    }
}