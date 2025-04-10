import { useEffect, useState } from "react";
import axios from "axios";

const useAuth = () => {
    const token = localStorage.getItem('Token');
    const [authenticated, setAuthenticated] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    
    useEffect(()=> {

        const verifyAuthentication = async () => {

            try {
                const response = await axios.get('http://localhost:5001/auth/verify', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                });

                if (response.data.valid) {
                    setAuthenticated(true);
                }
                
                else {
                    localStorage.removeItem('Token');
                }
            } catch (e) {
                localStorage.removeItem('Token');
            } finally {
                setAuthLoading(false);
            }
            
        }
        if (token) {
            verifyAuthentication();
        }
        
        else {
            setAuthLoading(false);
        }
    }, []);
    

    return { authenticated, authLoading };
}

export default useAuth;