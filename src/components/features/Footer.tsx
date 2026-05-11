import { HStack, VStack } from "../ui";

const Footer = () => {
  return (
    <footer
      aria-label="footer"
      className="flex w-full justify-center border-t border-white bg-gray-900 p-8"
    >
      <VStack className="flex w-full max-w-[1600px] items-start gap-1">
        <HStack className="gap-1.5 ">
          <span className="text-xl font-bold text-[#02f568]">
            FC온라인 강화 시뮬레이터
          </span>
        </HStack>
      </VStack>
    </footer>
  );
};

export default Footer;
