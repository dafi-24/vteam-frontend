

![sparkcykel](./admin/public/scooter.png)
# vteam-frontend

Detta är frontend-projektet för Vteam, utvecklat som en del av kursen på Blekinge Tekniska Högskola (BTH).


Projektet består av två olika klienter:
- **Admin-klient**: För administratörer att hantera elsparkcyklar, stationer, användare och rapporter.
- **Användarklient**: För slutanvändare att interagera med tjänsten.

Båda klienterna finns i detta repo under mapparna `admin/` (admin-klient) och `client/` (användarklient).

Applikationerna är byggda med React och är tänkta att användas tillsammans med vårt backend-API.

## Backend
Frontend-projektet är utvecklat i samarbete med backend-repot [vteam-backend](https://github.com/vinepine/vteam-backend).

All data och funktionalitet i frontend hämtas och hanteras via detta backend-API.

## Filstruktur

.
├── vteam-backend
└── vteam-frontend
    └── docker-compose.yml

## Kom igång
1. Klona detta repo
2. Installera beroenden med `npm install`
3. Starta utvecklingsservern med `npm start`

Se till att backend-API:t är igång för full funktionalitet.

## Kontakt
Vid frågor, kontakta projektgruppen.
