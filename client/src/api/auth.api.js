const post = async (path, body) => {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      data?.error?.message || "Something went wrong. Please try again.",
    );
    error.isApiError = true;
    error.fields = data?.error?.fields;
    throw error;
  }

  return data;
};

export const register = (values) => post("/api/auth/register", values);

export const login = (values) => post("/api/auth/login", values);
