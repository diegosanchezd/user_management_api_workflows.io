export type Roles = 'admin' | 'member' | 'viewer'

export interface User {
    id: number,
    name: string,
    email: string,
    role: Roles,
    created_at : string,
    updated_at: string
}