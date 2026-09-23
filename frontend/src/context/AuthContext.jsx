import React, { createContext, useContext } from "react";

const AuthContext = createContext({ user: "SIVA" });

export const AuthProvider = ({ children, value }) => (
  <AuthContext.Provider value={value || { user: "SIVA" }}>{children}</AuthContext.Provider>
);

export const useAuth = () => useContext(AuthContext);
