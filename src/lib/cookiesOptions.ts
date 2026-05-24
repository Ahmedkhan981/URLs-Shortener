export const cookieConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" ,
  signed: true,
  sameSite: "lax" as const,
};
