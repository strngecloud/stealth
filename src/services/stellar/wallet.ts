/**
 * Wallet authorization + signing via Freighter (@stellar/freighter-api v6).
 *
 * The canonical envelope payload is signed with the user's Stellar key
 * (Ed25519). If the user declines the wallet prompt we throw
 * WalletRejectedError so the caller can preserve the draft.
 */
import { isConnected, requestAccess, signMessage } from "@stellar/freighter-api";

export class WalletUnavailableError extends Error {
  constructor(message = "Freighter wallet was not detected") {
    super(message);
    this.name = "WalletUnavailableError";
  }
}

export class WalletRejectedError extends Error {
  constructor(message = "Wallet authorization was declined") {
    super(message);
    this.name = "WalletRejectedError";
  }
}

export interface WalletSignature {
  scheme: "Ed25519";
  signerAddress: string;
  value: string;
}

function describe(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  const maybe = error as { message?: unknown };
  return typeof maybe.message === "string" ? maybe.message : String(error);
}

function isUserRejection(message: string): boolean {
  return /(declin|deni|reject|cancel)/i.test(message);
}

function normalizeSignature(signed: unknown): string {
  if (typeof signed === "string") return signed;
  if (signed instanceof Uint8Array) {
    return Array.from(signed, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  const arrayLike = signed as { data?: number[] } | null;
  if (arrayLike && Array.isArray(arrayLike.data)) {
    return arrayLike.data.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return String(signed ?? "");
}

/**
 * Ask the wallet to authorize and sign the canonical envelope payload.
 *
 * Throws WalletUnavailableError if Freighter is not installed/connected, and
 * WalletRejectedError if the user declines. The pipeline relies on the
 * rejection error to keep the draft intact.
 */
export async function authorizeSend(canonicalPayload: string): Promise<WalletSignature> {
  const connection = (await isConnected()) as {
    isConnected?: boolean;
    error?: unknown;
  };
  if (!connection?.isConnected) {
    throw new WalletUnavailableError();
  }

  const access = (await requestAccess()) as {
    address?: string;
    error?: unknown;
  };
  const accessError = describe(access?.error);
  if (accessError) {
    if (isUserRejection(accessError)) {
      throw new WalletRejectedError(accessError);
    }
    throw new WalletUnavailableError(accessError);
  }

  const signed = (await signMessage(canonicalPayload)) as {
    signedMessage?: unknown;
    signerAddress?: string;
    error?: unknown;
  };
  const signError = describe(signed?.error);
  if (signError) {
    if (isUserRejection(signError)) {
      throw new WalletRejectedError(signError);
    }
    throw new Error("Wallet failed to sign the message");
  }

  return {
    scheme: "Ed25519",
    signerAddress: signed?.signerAddress ?? access?.address ?? "",
    value: normalizeSignature(signed?.signedMessage),
  };
}
