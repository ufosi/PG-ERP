# Instrukcja instalacji PG-ERP

## Wymagania
- Windows 10 lub nowszy
- Dostęp do internetu (do pobrania zależności)

## Krok 1: Zainstaluj Node.js

1. Pobierz NVM4W (Node Version Manager for Windows):
   - Wejdź na: https://github.com/coreybutler/nvm-windows/releases
   - Pobierz najnowszy plik `nvm-setup.exe`
   - Uruchom instalator i postępuj zgodnie z instrukcjami

2. Zainstaluj Node.js przez NVM:
   - Otwórz PowerShell lub Command Prompt
   - Uruchom: `nvm install 24`
   - Uruchom: `nvm use 24`

## Krok 2: Zainstaluj Git

1. Pobierz Git:
   - Wejdź na: https://git-scm.com/download/win
   - Pobierz instalator i uruchom go
   - W instalatorze wybierz opcje domyślne

## Krok 3: Sklonuj repozytorium

1. Otwórz PowerShell lub Command Prompt
2. Przejdź do folderu gdzie chcesz zainstalować projekt:
   ```
   cd C:\Users\TwojUzytkownik
   ```
3. Sklonuj repozytorium:
   ```
   git clone https://github.com/ufosi/PG-ERP.git
   cd PG-ERP
   ```

## Krok 4: Zainstaluj zależności

1. W folderze projektu uruchom:
   ```
   npm install
   ```

## Krok 5: Uruchom migrację bazy danych

1. Uruchom:
   ```
   npx prisma generate
   npx prisma db push
   ```

## Krok 6: Uruchom serwer deweloperski

1. Uruchom:
   ```
   npm run dev
   ```

2. Otwórz przeglądarkę i wejdź na:
   ```
   http://localhost:3000
   ```

## Logowanie

System używa logowania PIN:

**Domyślne PIN-y:**
- Admin: `1234`
- Biuro: `2345`
- Pracownik: `3456`

## Codzienna synchronizacja

Jeśli pracujesz na więcej niż jednym komputerze, przed rozpoczęciem pracy:

1. Pobierz najnowsze zmiany:
   ```
   git pull
   ```

Po zakończeniu pracy:

2. Wyślij swoje zmiany:
   ```
   git add -A
   git commit -m "opis zmian"
   git push
   ```

## Rozwiązywanie problemów

### Serwer nie startuje
- Upewnij się, że Node.js jest zainstalowany: `node --version`
- Sprawdź czy port 3000 nie jest zajęty przez inną aplikację

### Błędy bazy danych
- Usuń plik `prisma/dev.db` i uruchom ponownie `npx prisma db push`

### Błędy instalacji npm
- Spróbuj usunąć `node_modules` i `package-lock.json`, a potem ponownie `npm install`
