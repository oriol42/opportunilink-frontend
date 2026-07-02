import { api } from "./api";
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  level: string | null;
  field: string | null;
  city: string | null;
  languages: string[] | null;
  skills: string[] | null;
  skills_with_level: Record<string, number> | null;
  objectives: string[] | null;
  gpa: number | null;
  age: number | null;
  phone: string | null;
  opportuni_score: number;
  is_premium: boolean;
}
export interface LoginPayload {
  email: string;
  password: string;
}
export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
}
export function getToken(): string | null {
  return localStorage.getItem("access_token");
}
export function setToken(token: string): void {
  localStorage.setItem("access_token", token);
}
export function removeToken(): void {
  localStorage.removeItem("access_token");
}
export function isTokenExpired(): boolean {
  const token = getToken();
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return Date.now() > payload.exp * 1000;
  } catch {
    return true;
  }
}
export async function login(payload: LoginPayload): Promise<User> {
  const response = await api.post("/auth/login", payload);
  setToken(response.data.access_token);
  return fetchCurrentUser();
}
export async function register(payload: RegisterPayload): Promise<User> {
  const response = await api.post("/auth/register", payload);
  setToken(response.data.access_token);
  return fetchCurrentUser();
}
export function logout(): void {
  removeToken();
  window.location.href = "/login";
}
export async function fetchCurrentUser(): Promise<User> {
  const response = await api.get("/users/me");
  return response.data;
}
