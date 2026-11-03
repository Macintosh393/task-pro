import { Heading, Logo, Text } from '../../components/ui';
import { buttonVariants } from '../../components/ui/Button/button-variants';
import { cn } from '../../components/ui/cn';
import { focusRing } from '../../components/ui/control-styles';
import illustration from '../../assets/welcome/illustration.png';

export function WelcomePage() {
  return (
    <main
      className="welcome-page relative isolate flex min-h-svh items-center justify-center px-5 py-8"
      aria-labelledby="welcome-title"
    >
      <div
        className="welcome-texture pointer-events-none absolute inset-0 -z-1 hidden opacity-[0.02] mix-blend-color-burn md:block"
        aria-hidden="true"
      />
      <div className="flex w-full max-w-[335px] flex-col items-center md:max-w-[473px]">
        <img
          src={illustration}
          alt=""
          width={162}
          height={162}
          className="size-[124px] md:size-[162px]"
        />
        <Heading level={1} id="welcome-title" className="mt-3.5 flex md:mt-6">
          <Logo variant="welcome" />
        </Heading>
        <Text className="mt-6 text-center leading-[1.2857142857]">
          Supercharge your productivity and take control of your tasks with Task Pro - Don't wait,
          start achieving your goals now!
        </Text>
        <nav
          aria-label="Get started"
          className="mt-12 flex w-full flex-col items-center md:w-[344px]"
        >
          <a
            href="/register"
            className={cn(
              buttonVariants({ variant: 'neutral', size: 'large', fullWidth: true }),
              'px-4',
            )}
          >
            Registration
          </a>
          <a
            href="/login"
            className={cn(
              '-mb-3 mt-[3px] inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm/[21px] font-medium tracking-[-0.02em] hover:underline',
              focusRing,
            )}
          >
            Log In
          </a>
        </nav>
      </div>
    </main>
  );
}
