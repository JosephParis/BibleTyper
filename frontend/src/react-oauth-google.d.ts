declare module '@react-oauth/google' {
  import { FC, ReactNode } from 'react';

  interface GoogleOAuthProviderProps {
    clientId: string;
    children: ReactNode;
  }

  interface CredentialResponse {
    credential?: string;
    select_by?: string;
    clientId?: string;
  }

  interface GoogleLoginProps {
    onSuccess: (credentialResponse: CredentialResponse) => void;
    onError?: () => void;
    size?: 'small' | 'medium' | 'large';
    width?: string;
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  }

  export const GoogleOAuthProvider: FC<GoogleOAuthProviderProps>;
  export const GoogleLogin: FC<GoogleLoginProps>;
}
