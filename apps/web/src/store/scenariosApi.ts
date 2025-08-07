import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Scenario, ScenarioInput } from '@shared/types'
import { RootState } from './index'

export const scenariosApi = createApi({
  reducerPath: 'scenariosApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/scenarios',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['Scenario'],
  endpoints: builder => ({
    getScenarios: builder.query<Scenario[], void>({
      query: () => '',
      providesTags: ['Scenario'],
    }),
    createScenario: builder.mutation<Scenario, { projectId?: string; inputs: ScenarioInput }>({
      query: body => ({
        url: '',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Scenario'],
    }),
    updateScenario: builder.mutation<Scenario, { id: string; inputs: ScenarioInput }>({
      query: ({ id, inputs }) => ({
        url: id,
        method: 'PUT',
        body: { inputs },
      }),
      invalidatesTags: ['Scenario'],
    }),
  }),
})

export const {
  useGetScenariosQuery,
  useCreateScenarioMutation,
  useUpdateScenarioMutation,
} = scenariosApi