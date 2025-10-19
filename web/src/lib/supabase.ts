// Dummy Supabase client for development
// This allows the app to run without Supabase integration

export const supabase = {
  auth: {
    getSession: async () => ({
      data: { session: null },
      error: null
    }),
    signOut: async () => ({
      error: null
    })
  }
};

