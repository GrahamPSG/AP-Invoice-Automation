import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Project } from '@shared/types'
import { RootState } from './index'

export const projectsApi = createApi({
  reducerPath: 'projectsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/projects',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['Project'],
  endpoints: builder => ({
    getProjects: builder.query<Project[], void>({
      query: () => '',
      providesTags: ['Project'],
    }),
    uploadProject: builder.mutation<Project, FormData>({
      query: formData => ({
        url: '',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Project'],
    }),
    updateColumnMap: builder.mutation<Project, { id: string; columnMap: Record<string, string> }>({
      query: ({ id, columnMap }) => ({
        url: `${id}/column-map`,
        method: 'POST',
        body: { columnMap },
      }),
      invalidatesTags: ['Project'],
    }),
  }),
})

export const {
  useGetProjectsQuery,
  useUploadProjectMutation,
  useUpdateColumnMapMutation,
} = projectsApi