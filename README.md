# 🔗 SwiftLink | URL Shortener

A robust, full-stack URL shortener featuring secure authentication, individual user dashboards, and real-time analytics. Built with a focus on speed, security, and a seamless user experience.

---

# 🚀 Features

- **Social Authentication**  
  Secure login integration via Google and GitHub OAuth.

- **Individual Dashboards**  
  Every user has a personalized space to manage their private links.

- **URL Management**  
  Effortlessly create, track, and delete shortened URLs.

- **Real-time Analytics**  
  Monitor link performance with total click tracking.

- **Authorization**  
  Custom middleware protection ensures users can only access and modify their own data.

- **Responsive UI**  
  High-performance server-side rendering using EJS and Tailwind CSS.

---

# 🛠️ Tech Stack

## Frontend

- EJS (Embedded JavaScript)

## Backend

- Node.js
- Express.js

## Database

- MongoDB (Mongoose)  
  **or**
- Mysql (Drizzle / Prisma)

## Authentication

- Arctic.js (Social Strategies)

## Runtime

- Node.js
- Bun

---

# 📂 Project Structure

```bash
├── src/
│   ├── config/         # Passport & DB configurations
│   ├── controllers/    # Request handlers (Auth, URL logic)
│   ├── middleware/     # Auth & validation guards
│   ├── models/         # Database schemas
│   ├── routes/         # Express routes (Auth, Dashboard, API)
│   └── views/          # EJS templates (Login, Dashboard, 404)
├── public/             # Static assets (CSS, JS, Images)
└── .env                # Environment variables (Keep secret!)
```

---

# ⚙️ Getting Started

## 1. Clone the Repository

```bash
git clone https://github.com/yourusername/url-shortener.git
cd url-shortener
```

---

## 2. Install Dependencies

```bash
npm install
```

### Or using Bun

```bash
bun install
```

---

## 3. Environment Variables

Create a `.env` file in the root directory and add your credentials:

```env
# Database
DATABASE_URL=mysql://user:password@host:port/database

# Authentication
JWT_SECRET_KEY=your_jwt_secret_here
ACCESS_TOKEN_JWT_SECRET_KEY=your_access_token_secret_here
REFRESH_TOKEN_JWT_SECRET_KEY=your_refresh_token_secret_here
SESSION_SECRET=your_session_secret_here

# Environment
NODE_ENV=development
PORT=5000

# Third-Party Services
RESEND_API_KEY=your_resend_api_key_here

# OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/google/callback

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:5000/github/callback
```

> Note: On Vercel, `.env` is not used in production. Add the same keys to the Vercel project Environment Variables panel.
>
> Required production variables include `SESSION_SECRET`, `DATABASE_URL`, `JWT_SECRET_KEY`, `ACCESS_TOKEN_JWT_SECRET_KEY`, `REFRESH_TOKEN_JWT_SECRET_KEY`, `RESEND_API_KEY`, and the OAuth variables above.

---

## 4. Run the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

---

# 🛡️ API & Routes

| Method | Route          | Description                          |
| ------ | -------------- | ------------------------------------ |
| GET    | `/auth/google` | Trigger Google OAuth Login           |
| GET    | `/auth/github` | Trigger GitHub OAuth Login           |
| GET    | `/dashboard`   | View user-specific links (Protected) |
| POST   | `/api/shorten` | Create a new shortened URL           |
| GET    | `/:shortId`    | Redirect to original target URL      |

---

# 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

# ❤️ Author

Built with ❤️ by **Ahmed Khan**
