/*
 * Numera - C number-system conversion engine
 * Adapted from the original nsc.c assignment.
 * The twelve original conversion directions are preserved.
 * This file is compiled to WebAssembly for browser execution.
 */

typedef unsigned int numera_uint;

#define NUMERA_MAX (~(numera_uint)0)

static int digit_value(char ch) {
    if (ch >= '0' && ch <= '9') return ch - '0';
    if (ch >= 'A' && ch <= 'F') return ch - 'A' + 10;
    if (ch >= 'a' && ch <= 'f') return ch - 'a' + 10;
    return -1;
}

/* Returns 0 on success, 1 for invalid input, 2 for overflow, 3 for bad base. */
__attribute__((visibility("default")))
int numera_convert(const char *input, int from_base, int to_base,
                   char *output, int output_capacity) {
    numera_uint value = 0;
    int i = 0;
    int digits = 0;
    int count = 0;
    const char *alphabet = "0123456789ABCDEF";

    if (!input || !output || output_capacity < 2) return 1;
    if (!((from_base == 2 || from_base == 8 || from_base == 10 || from_base == 16) &&
          (to_base == 2 || to_base == 8 || to_base == 10 || to_base == 16))) return 3;

    while (input[i] == ' ' || input[i] == '\t' || input[i] == '\n' || input[i] == '\r') i++;
    if (input[i] == '+') i++;
    if (input[i] == '-') return 1; /* The original assignment works with non-negative integers. */

    for (; input[i] != '\0'; i++) {
        int d;
        if (input[i] == ' ' || input[i] == '\t' || input[i] == '\n' || input[i] == '\r') break;
        d = digit_value(input[i]);
        if (d < 0 || d >= from_base) return 1;
        if (value > (NUMERA_MAX - (numera_uint)d) / (numera_uint)from_base) return 2;
        value = value * (numera_uint)from_base + (numera_uint)d;
        digits++;
    }
    if (digits == 0) return 1;
    while (input[i] == ' ' || input[i] == '\t' || input[i] == '\n' || input[i] == '\r') i++;
    if (input[i] != '\0') return 1;

    if (value == 0) output[count++] = '0';
    while (value > 0) {
        output[count++] = alphabet[value % (numera_uint)to_base];
        value /= (numera_uint)to_base;
    }
    if (count + 1 > output_capacity) return 2;
    for (i = 0; i < count / 2; i++) {
        char temporary = output[i];
        output[i] = output[count - i - 1];
        output[count - i - 1] = temporary;
    }
    output[count] = '\0';
    return 0;
}
