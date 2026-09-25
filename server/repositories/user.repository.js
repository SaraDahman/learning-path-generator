import AppError from "../errors/AppError.js";
import { getAdminSupabase, getPublicSupabase } from "../config/supabase.js";

const mapAuthError = (error, operation) => {
  const message = error?.message?.toLowerCase() || "";

  if (
    message.includes("already registered") ||
    message.includes("already exists")
  ) {
    return new AppError("An account with this email already exists.", {
      statusCode: 409,
      code: "EMAIL_ALREADY_REGISTERED",
      details: error,
    });
  }

  if (operation === "login" && message.includes("invalid login credentials")) {
    return new AppError("The email or password is incorrect.", {
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
      details: error,
    });
  }

  if (message.includes("password")) {
    return new AppError(
      "Please choose a stronger password with at least 6 characters.",
      {
        statusCode: 400,
        code: "PASSWORD_POLICY",
        details: error,
      },
    );
  }

  return new AppError("Authentication request failed.", {
    statusCode: 400,
    code: "SUPABASE_AUTH_ERROR",
    details: error,
  });
};

export const signUp = async ({ email, password }) => {
  const { data, error } = await getPublicSupabase().auth.signUp({
    email,
    password,
  });

  if (error) throw mapAuthError(error, "signup");
  return data;
};

export const signIn = async ({ email, password }) => {
  const { data, error } = await getPublicSupabase().auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw mapAuthError(error, "login");
  return data;
};

const mapProfileError = (error) => {
  const message = (error?.message || "").toLowerCase();
  const details = (error?.details || "").toLowerCase();
  const isUniqueViolation = error?.code === "23505" || message.includes("duplicate key");

  if (isUniqueViolation && (message.includes("username") || details.includes("username"))) {
    return new AppError("That username is already taken.", {
      statusCode: 409,
      code: "USERNAME_ALREADY_TAKEN",
      details: { fields: { username: "That username is already taken." } },
    });
  }

  if (isUniqueViolation && (message.includes("email") || details.includes("email"))) {
    return new AppError("An account with this email already exists.", {
      statusCode: 409,
      code: "EMAIL_ALREADY_REGISTERED",
      details: { fields: { email: "An account with this email already exists." } },
    });
  }

  if (isUniqueViolation) {
    return new AppError("That username or email is already in use.", {
      statusCode: 409,
      code: "PROFILE_CONFLICT",
    });
  }

  console.warn(`[profile] insert failed (${error?.code || "unknown"}): ${error?.message}`);

  return new AppError("Your profile could not be created.", {
    statusCode: 500,
    code: "PROFILE_CREATE_FAILED",
    details: error,
  });
};

export const createProfile = async ({ id, username, email }) => {
  const { data, error } = await getAdminSupabase()
    .from("profiles")
    .insert({ id, username, email })
    .select("id, username, email")
    .single();

  if (error) {
    throw mapProfileError(error);
  }

  return data;
};

export const deleteAuthUser = async (userId) => {
  const { error } = await getAdminSupabase().auth.admin.deleteUser(userId);
  if (error) throw error;
};
