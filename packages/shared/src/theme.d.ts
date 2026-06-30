/**
 * KHALA / Qader design tokens — "Liquid Glass" premium dark theme.
 * Shared by the Qader app (React Native) and the Admin panel so the brand stays in sync.
 */
export declare const colors: {
    readonly bg0: "#0B1020";
    readonly bg1: "#121A33";
    readonly bg2: "#1A2340";
    readonly brand: "#2EC5B6";
    readonly brand2: "#6C8BFF";
    readonly gold: "#E9C46A";
    readonly danger: "#FF6B6B";
    readonly success: "#48D597";
    readonly textHi: "#F4F7FF";
    readonly textMid: "#C3CCE6";
    readonly textLo: "#9AA6C4";
    readonly glassFill: "rgba(255,255,255,0.06)";
    readonly glassFillStrong: "rgba(255,255,255,0.10)";
    readonly glassBorder: "rgba(255,255,255,0.14)";
    readonly glassHighlight: "rgba(255,255,255,0.22)";
};
export declare const glass: {
    readonly blur: 24;
    readonly radius: 26;
    readonly borderWidth: 1;
};
/** Cairo type scale (Arabic-optimised line-heights). */
export declare const typography: {
    readonly fontFamily: "Cairo";
    readonly display: {
        readonly size: 32;
        readonly weight: "700";
        readonly lineHeight: 44;
    };
    readonly h1: {
        readonly size: 24;
        readonly weight: "700";
        readonly lineHeight: 38;
    };
    readonly h2: {
        readonly size: 20;
        readonly weight: "600";
        readonly lineHeight: 32;
    };
    readonly body: {
        readonly size: 16;
        readonly weight: "400";
        readonly lineHeight: 28;
    };
    readonly caption: {
        readonly size: 13;
        readonly weight: "400";
        readonly lineHeight: 22;
    };
};
export declare const spacing: {
    readonly xs: 4;
    readonly sm: 8;
    readonly md: 16;
    readonly lg: 24;
    readonly xl: 32;
    readonly xxl: 48;
};
export declare const radii: {
    readonly sm: 12;
    readonly md: 18;
    readonly lg: 26;
    readonly pill: 999;
};
export declare const gradients: {
    readonly appBackground: readonly ["#0B1020", "#121A33", "#0B1020"];
    readonly brand: readonly ["#2EC5B6", "#6C8BFF"];
    readonly premium: readonly ["#E9C46A", "#2EC5B6"];
};
