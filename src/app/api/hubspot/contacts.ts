interface Contact {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  [key: string]: unknown;
}

interface ContactError {
  error: string;
  status: number;
}

export async function processContact(contact: Contact): Promise<Contact | ContactError> {
  try {
    // ... existing code ...
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { error: errorMessage, status: 500 };
  }
}
// ... existing code ... 