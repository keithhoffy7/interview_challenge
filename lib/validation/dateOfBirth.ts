/**
 * Validates date of birth (YYYY-MM-DD).
 * Returns true when valid; otherwise returns a descriptive error string.
 */
export function validateDateOfBirth(value: string): true | string {
    if (!value) return "Date of birth is required";

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(value)) {
        return "Invalid date format";
    }

    const [year, month, day] = value.split("-").map(Number);
    const dob = new Date(Date.UTC(year, month - 1, day));

    // Ensure parsed date matches input (catches invalid dates like 2024-02-30)
    if (dob.getUTCFullYear() !== year || dob.getUTCMonth() !== month - 1 || dob.getUTCDate() !== day) {
        return "Invalid date";
    }

    const today = new Date();
    const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

    if (dob > todayUtc) {
        return "Date of birth cannot be in the future";
    }

    let age = todayUtc.getUTCFullYear() - year;
    const hasHadBirthdayThisYear =
        todayUtc.getUTCMonth() > dob.getUTCMonth() ||
        (todayUtc.getUTCMonth() === dob.getUTCMonth() && todayUtc.getUTCDate() >= dob.getUTCDate());
    if (!hasHadBirthdayThisYear) {
        age -= 1;
    }

    if (age < 18) {
        return "You must be at least 18 years old";
    }

    return true;
}

