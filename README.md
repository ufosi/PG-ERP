# PG-ERP

Nowoczesny szkielet aplikacji ERP/MES dla firmy produkcyjnej.

## Stack

- Next.js 15
- TypeScript
- TailwindCSS
- PostgreSQL
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

## Uruchomienie

1. Zainstaluj zależności:

```bash
npm install
```

2. Skopiuj konfigurację środowiska:

```bash
cp .env.example .env
```

3. Ustaw `DATABASE_URL` oraz bezpieczny `AUTH_SECRET` w pliku `.env`.

4. Uruchom migrację i seed:

```bash
npm run prisma:migrate
npm run db:seed
```

5. Uruchom aplikację:

```bash
npm run dev
```

## Konta testowe

- Administrator: PIN `1234`, RFID `ADMIN-001`
- Biuro: PIN `2345`, RFID `BIURO-001`
- Pracownik: PIN `3456`, RFID `PRAC-001`

Pole RFID jest opcjonalne, więc na starcie można zalogować się samym PIN-em.
