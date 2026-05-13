// Customer-shape type kept here because other modules (updateCustomer,
// checkout's createNewCart, the registry types) import it. The actual
// createCustomer service was removed when the storefront moved to
// Firebase Auth — customer rows are now provisioned inside the
// Firebase auth handler in customerAuthFirebaseJson.
export interface CustomerData {
  email?: string;
  full_name?: string;
  password?: string;
  group_id?: number;
  status?: number;
}
