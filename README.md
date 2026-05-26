# PG-ERP

Nowoczesny szkielet aplikacji ERP/MES dla firmy produkcyjnej.

## Stack

- Next.js 15
- TypeScript
- TailwindCSS
- SQLite (lokalnie) / PostgreSQL (produkcja)
- Prisma ORM
- Auth.js / NextAuth v5
- shadcn/ui-style components

## Funkcje startowe

- Ciemny motyw
- Logowanie przez PIN i opcjonalny RFID
- Role użytkowników: ADMIN, BIURO, PRACOWNIK
- Chroniony layout aplikacji
- Sidebar przygotowany pod moduły ERP/MES
- Dashboard po zalogowaniu
- Prisma schema pod dalszy rozwój

## Praca na dwóch komputerach

### Na nowym komputerze

1. Sklonuj repozytorium:

```bash
git clone https://github.com/ufosi/PG-ERP.git
cd PG-ERP
```

2. Zainstaluj zależności:

```bash
npm install
```

3. Skopiuj konfigurację środowiska:

```bash
cp .env.example .env
```

4. Uruchom migrację i seed:

```bash
npm run prisma:migrate
npm run db:seed
```

5. Uruchom aplikację:

```bash
npm run dev
```

### Synchronizacja zmian między komputerami

Przed rozpoczęciem pracy na komputerze:

```bash
git pull
```

Po zakończeniu pracy:

```bash
git add .
git commit -m "opis zmian"
git push
```

Na drugim komputerze przed kontynuacją:

```bash
git pull
```

**Ważne:** `.env` i baza danych SQLite (`prisma/dev.db`) są w `.gitignore`, więc każde środowisko ma swoją własną konfigurację i bazę.

## Uruchomienie (pierwszy raz)

1. Zainstaluj zależności:

```bash
npm install
```

2. Skopiuj konfigurację środowiska:

```bash
cp .env.example .env
```

3. Uruchom migrację i seed:

```bash
npm run prisma:migrate
npm run db:seed
```

4. Uruchom aplikację:

```bash
npm run dev
```

Aplikacja będzie dostępna na `http://localhost:3000`.

## Uruchomienie (codziennie)

```bash
git pull
npm run dev
```

## Konta testowe

- Administrator: PIN `1234`, RFID `ADMIN-001`
- Biuro: PIN `2345`, RFID `BIURO-001`
- Pracownik: PIN `3456`, RFID `PRAC-001`

Pole RFID jest opcjonalne, więc na starcie można zalogować się samym PIN-em.
