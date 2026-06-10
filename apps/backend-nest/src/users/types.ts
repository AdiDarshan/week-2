
export interface User {
  id: string;
  name: string;
}

export interface RegisteredUser extends User {
  email: string;
  passwordHash: string;
}
