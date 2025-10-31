



import { } from '../domain/port.users';
import type { UserServiceProvider } from '../domain/port.users';
import { UserService } from '../../users/domain/service.users';
import { type UserDetails } from '../domain/port.users';




export class UserFeatuerAdapter implements UserServiceProvider {
    private service: UserService;

    constructor(service: UserService){
        this.service = service;
    }

    async getUserDetailsForAuth(userId: string): Promise<UserDetails | null> {
        const userEntity = await this.service.findUserById(userId);
        
        if(!userEntity){
            return null;
        }

        return {
            userId: userEntity.id,
            role: userEntity.role,
        };
      
    }

}