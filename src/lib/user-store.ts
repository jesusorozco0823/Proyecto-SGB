// src/lib/user-store.ts
import type { User } from './types';
import { mockUsers as defaultUsers } from './mock-data';

const USERS_STORAGE_KEY = 'salonflow_users';

let users: User[] = [];

// Función para inicializar los usuarios desde localStorage o desde los datos por defecto
const initializeUsers = () => {
  try {
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (storedUsers) {
      users = JSON.parse(storedUsers);
    } else {
      // Si no hay nada en localStorage, usamos los datos de ejemplo y los guardamos
      users = defaultUsers;
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
  } catch (error) {
    // Si hay un error (ej. en SSR o localStorage no disponible), usamos los datos por defecto
    console.error('No se pudo acceder a localStorage. Usando datos de ejemplo en memoria.');
    users = defaultUsers;
  }
};

// Se llama a la función una vez al cargar el módulo
initializeUsers();

/**
 * Obtiene la lista completa de usuarios.
 * @returns {User[]} La lista de usuarios.
 */
export const getUsers = (): User[] => {
  // Asegurarnos de que los datos están cargados si estamos en el cliente
  if (typeof window !== 'undefined' && users.length === 0) {
      initializeUsers();
  }
  return users;
};

/**
 * Añade un nuevo usuario a la lista y lo guarda en localStorage.
 * @param {User} newUser - El nuevo usuario a añadir.
 */
export const addUser = (newUser: User) => {
  // Prevenimos duplicados por número de documento
  if (users.some(user => user.documentNumber === newUser.documentNumber)) {
      console.warn(`El usuario con el documento ${newUser.documentNumber} ya existe.`);
      return;
  }
  
  users.push(newUser);
  
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
     console.error('No se pudo guardar el nuevo usuario en localStorage.');
  }
};

/**
 * Actualiza un usuario existente en la lista y lo guarda en localStorage.
 * @param {User} updatedUser - El usuario con los datos actualizados.
 */
export const updateUser = (updatedUser: User) => {
    const userIndex = users.findIndex(user => user.id === updatedUser.id);
    if (userIndex !== -1) {
        users[userIndex] = updatedUser;
        try {
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        } catch (error) {
            console.error('No se pudo actualizar el usuario en localStorage.');
        }
    }
};

/**
 * Elimina un usuario de la lista y actualiza localStorage.
 * @param {string} userId - El ID del usuario a eliminar.
 */
export const deleteUser = (userId: string) => {
    const initialLength = users.length;
    users = users.filter(user => user.id !== userId);
    
    if (users.length < initialLength) {
         try {
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        } catch (error) {
            console.error('No se pudo actualizar localStorage después de eliminar el usuario.');
        }
    }
};
