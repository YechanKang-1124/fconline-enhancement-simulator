import { HStack } from "@/components/ui";

const Header = () => {
  return (
    <header className="flex w-full justify-center border-b border-gray-200 bg-white px-8">
      <HStack className="h-22 w-full justify-start">
        <span>FC온라인 강화 시뮬레이터</span>
      </HStack>
    </header>
  );
};

export default Header;
