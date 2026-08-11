using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Globalization;
using System.Text.RegularExpressions;

namespace TesisFlow.Contexto.Conversores;

public partial class EmojiValueConverter : ValueConverter<string?, string?>
{
    private static readonly Regex UnicodeEscapeRegex = UnicodeEscapePattern();

    public EmojiValueConverter()
        : base(
            v => Encode(v),
            v => Decode(v))
    {
    }

    private static string? Encode(string? value)
    {
        if (string.IsNullOrEmpty(value))
            return value;

        var chars = value.AsSpan();
        for (var i = 0; i < chars.Length; i++)
        {
            if (char.IsSurrogate(chars[i]))
                return EncodeFull(value);
        }

        return value;
    }

    private static string? Decode(string? value)
    {
        if (string.IsNullOrEmpty(value))
            return value;

        if (!value.Contains("U+"))
            return value;

        return UnicodeEscapeRegex.Replace(value, match =>
        {
            var codePoint = int.Parse(match.Groups[1].Value, NumberStyles.HexNumber);
            return char.ConvertFromUtf32(codePoint);
        });
    }

    private static string EncodeFull(string value)
    {
        var result = "";
        for (var i = 0; i < value.Length; i++)
        {
            if (char.IsSurrogatePair(value, i))
            {
                var codePoint = char.ConvertToUtf32(value, i);
                result += $"U+{codePoint:X}";
                i++;
            }
            else
            {
                result += value[i];
            }
        }
        return result;
    }

#if NET9_0_OR_GREATER
    [GeneratedRegex(@"U\+([0-9A-Fa-f]+)")]
    private static partial Regex UnicodeEscapePattern();
#else
    private static Regex UnicodeEscapePattern() => new(@"U\+([0-9A-Fa-f]+)", RegexOptions.Compiled);
#endif
}
