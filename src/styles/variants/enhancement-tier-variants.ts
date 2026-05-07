import { cva, type VariantProps } from "class-variance-authority";

export const enhanceTierVariants = cva(
  "inline-flex h-9 items-center justify-center border-2 font-[FCOAllSans] text-3xl font-bold",
  {
    variants: {
      type: {
        badge: "w-14.5",
        button: "w-20.5 cursor-pointer",
      },
      tier: {
        iron: "border-t-[#62676d] border-r-[#393a3c] border-b-[#393a3c] border-l-[#62676d] bg-[linear-gradient(140deg,#51545a,#42464d)] text-[#c5c8c9]",
        bronze:
          "border-t-[#e4b7a2] border-r-[#864229] border-b-[#864229] border-l-[#e4b7a2] bg-[linear-gradient(140deg,#de946b,#ad5f42)] text-[#7e3f27]",
        silver:
          "border-t-[#d8dadc] border-r-[#a9aaae] border-b-[#a9aaae] border-l-[#d8dadc] bg-[linear-gradient(140deg,#d8d9dc,#b8bdca)] text-[#4e545e]",
        gold: "border-t-[#e9d36c] border-r-[#cda000] border-b-[#cda000] border-l-[#e9d36c] bg-[linear-gradient(140deg,#f9dd62,#dca908)] text-[#695100]",
        platinum:
          'border-t-[#bdc5e5] border-r-[#607dc4] border-b-[#607dc4] border-l-[#bdc5e5] bg-[url("/images/bg-platinum.png")] bg-cover bg-center bg-no-repeat text-[#2d2b43]',
      },
    },
    defaultVariants: {
      tier: "iron",
    },
  },
);

export type EnhanceVariantsProps = VariantProps<typeof enhanceTierVariants>;
