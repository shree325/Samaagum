export async function withProviderRollback<T>(
  providerAction: () => Promise<T>,
  dbAction: (result: T) => Promise<void>,
  rollbackAction: (result: T) => Promise<void>
): Promise<T> {
  const result = await providerAction();
  try {
    await dbAction(result);
    return result;
  } catch (error) {
    try {
      await rollbackAction(result);
    } catch (rollbackError: any) {
      console.error('⚠️ Rollback action failed:', rollbackError.message);
    }
    throw error; // Rethrow original DB error
  }
}
