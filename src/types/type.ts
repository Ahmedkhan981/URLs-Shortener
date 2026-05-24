export type RegisterType = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};
export type LoginType = {
  email: string;
  password: string;
};

export type Token = {
  id: number;
  username: string;
  email: string;
};

export type CreateSessionPayload = {
  ip_address: string;
  user_agent: string;
};

export type accessTokenPayLoad = {
  id: number;
  username: string;
  email: string;
  sessionId: number;
  isEmailValid: boolean;
};

export type EmailPayload = {
  to: string;
  subjectEmail: string;
  htmlEmail: string;
};

export interface ResetSessionPayload {
  userId: number;
  email: string;
  purpose: "password-reset-verify";
}

export interface GoogleIDTokenClaims {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  at_hash: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  iat: number;
  exp: number;
}
export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  email: string | null;
  [key: string]: any;
}

export interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

