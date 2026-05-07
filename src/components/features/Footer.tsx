import { imageLogoWhite } from "@/assets/images";

import { HStack, VStack } from "../ui";

const Footer = () => {
  return (
    <footer
      aria-label="footer"
      className="flex w-full justify-center border-t border-white bg-blue-500 p-8 text-white"
    >
      <VStack className="flex w-full max-w-[1600px] items-start gap-1">
        <HStack className="gap-1.5 ">
          <span className="text-xl font-semibold text-white">
            FC온라인 강화 시뮬레이터
          </span>
        </HStack>
      </VStack>
    </footer>
  );
};

export default Footer;
