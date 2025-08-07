import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'

import { authSlice } from './authSlice'
import { projectsApi } from './projectsApi'
import { scenariosApi } from './scenariosApi'

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    [projectsApi.reducerPath]: projectsApi.reducer,
    [scenariosApi.reducerPath]: scenariosApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(
      projectsApi.middleware,
      scenariosApi.middleware
    ),
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch