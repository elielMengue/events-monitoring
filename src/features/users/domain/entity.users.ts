
export type UserRole = 'admin' | 'member';

export type UserEntry = {
  user_id: string;
  email: string;
  username: string;
  role: UserRole;
  password: string; 
  createdAt: Date;
};

export interface LoginOutput {
  token: string;
}

export class User {
  private readonly props: UserEntry;

  constructor(props: UserEntry) {
    this.props = { ...props };
  }


  get id(): string {
    return this.props.user_id;
  }
  get email(): string {
    return this.props.email;
  }
  get username(): string {
    return this.props.username;
  }
  get role(): UserRole {
    return this.props.role;
  }
  get password(): string {
    return this.props.password;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON() {
    const { password, ...rest } = this.props;
    return rest;
  }

  withUpdatedPassword(newHashedPassword: string): User {
    return new User({ ...this.props, password: newHashedPassword });
  }

  withUpdatedProps(partial: Partial<Omit<UserEntry, 'user_id' | 'createdAt'>>): User {
    return new User({
      ...this.props,
      ...partial,
    });
  }

  get raw(): UserEntry {
    return { ...this.props };
  }
}
