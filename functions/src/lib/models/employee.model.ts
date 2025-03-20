export interface Employee {
    uid: string;
    role: "admin" | "manager" | "employee";
  }
  
 export interface EmployeeWithProfile extends Employee {
    displayName?: string;
    email?: string;
  }
  