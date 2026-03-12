import {Auth0Client} from "@auth0/nextjs-auth0/server";
import {NextResponse, type NextRequest} from "next/server";

const auth0Domain = process.env.AUTH0_DOMAIN;
const auth0ClientId = process.env.AUTH0_CLIENT_ID;
const auth0ClientSecret = process.env.AUTH0_CLIENT_SECRET;
const auth0Secret = process.env.AUTH0_SECRET;
const backendAudience = process.env.BACKEND_AUTH0_AUDIENCE ?? process.env.AUTH0_AUDIENCE;

export const isAuth0Configured = Boolean(
  auth0Domain &&
    auth0ClientId &&
    auth0ClientSecret &&
    auth0Secret,
);

let auth0ClientSingleton: Auth0Client | null = null;

const getAllowedAppBaseUrls = () => {
  const configuredBaseUrl = process.env.APP_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  return undefined;
};

export const getAuth0Client = () => {
  if (!isAuth0Configured) {
    return null;
  }

  if (!auth0ClientSingleton) {
    auth0ClientSingleton = new Auth0Client({
      domain: auth0Domain,
      clientId: auth0ClientId,
      clientSecret: auth0ClientSecret,
      secret: auth0Secret,
      appBaseUrl: getAllowedAppBaseUrls(),
      authorizationParameters: backendAudience
        ? {
            audience: backendAudience,
          }
        : undefined,
      enableAccessTokenEndpoint: false,
      signInReturnToPath: "/",
    });
  }

  return auth0ClientSingleton;
};

export const runAuth0Middleware = async (request: NextRequest) => {
  const auth0Client = getAuth0Client();

  if (!auth0Client) {
    return NextResponse.next();
  }

  return auth0Client.middleware(request);
};

export const getAuth0Session = async () => {
  const auth0Client = getAuth0Client();

  if (!auth0Client) {
    return null;
  }

  return auth0Client.getSession();
};

export const getAuth0AccessToken = async () => {
  const auth0Client = getAuth0Client();

  if (!auth0Client) {
    return null;
  }

  return auth0Client.getAccessToken(
    backendAudience
      ? {
          audience: backendAudience,
        }
      : undefined,
  );
};
