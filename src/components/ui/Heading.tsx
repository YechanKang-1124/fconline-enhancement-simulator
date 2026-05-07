interface HeadingProps {
  children: React.ReactNode;
}

const Heading = ({ children }: HeadingProps) => {
  return <h1 className="text-2xl font-semibold tracking-tight">{children}</h1>;
};

export default Heading;
