

export type UserRole = 'admin' | 'member'; 

export interface UserDetails {
    userId: string;
    role: UserRole;
} 


export interface UserServiceProvider {
    getUserDetailsForAuth(userId: string): Promise<UserDetails | null>;
}