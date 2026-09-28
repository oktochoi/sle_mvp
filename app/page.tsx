"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { restaurants, type Restaurant } from "./restaurants";

const areas = [
  { value: "흥해", emoji: "🌾", hint: "캠퍼스에서 가까운 쪽" },
  { value: "양덕", emoji: "🛍️", hint: "북적이는 맛집 거리" },
  { value: "영일대", emoji: "🌊", hint: "바다가 보이는 골목" },
  { value: "효자", emoji: "🍃", hint: "조용히 먹고 싶은 날" },
  { value: "시내", emoji: "🏙️", hint: "포항의 중심" },
  { value: "어디든", emoji: "✨", hint: "맛있으면 충분해요" },
] as const;

const foods = [
  { value: "한식", emoji: "🍚", hint: "따뜻한 한 상" },
  { value: "중식", emoji: "🍜", hint: "짜장과 양꼬치" },
  { value: "일식", emoji: "🍣", hint: "초밥과 텐동" },
  { value: "양식", emoji: "🍝", hint: "파스타 한 접시" },
  { value: "고기", emoji: "🥩", hint: "불판 위 저녁" },
  { value: "분식", emoji: "🍢", hint: "가볍고 빠르게" },
  { value: "아무거나", emoji: "🌊", hint: "오늘 바다가 고르게" },
] as const;

const prices = [
  { label: "10,000원 이하", max: 10000, title: "가볍게", hint: "부담 없이 한 끼", emoji: "🍃" },
  { label: "15,000원 이하", max: 15000, title: "무난하게", hint: "가장 편한 선", emoji: "☕️" },
  { label: "20,000원 이하", max: 20000, title: "든든하게", hint: "조금 더 푸짐하게", emoji: "🍽️" },
  { label: "상관없음", max: null, title: "오늘은 맘껏", hint: "예산은 내려놓기", emoji: "✨" },
] as const;

type AreaOption = (typeof areas)[number]["value"];
type FoodOption = (typeof foods)[number]["value"];
type PriceOption = (typeof prices)[number]["label"];
type Step = "intro" | "area" | "food" | "budget" | "result";

const areaLine: Record<AreaOption, string> = {
  흥해: "캠퍼스 근처에서 찾은 한 끼",
  양덕: "양덕 골목에서 찾은 한 끼",
  영일대: "바다 가까운 곳에서 찾은 한 끼",
  효자: "효자 골목에서 찾은 한 끼",
  시내: "포항 시내에서 찾은 한 끼",
  어디든: "오늘 발길이 머문 한 끼",
};

const ADVANCE_MS = 260;

function getMatches(area: AreaOption, food: FoodOption, priceLabel: PriceOption) {
  const price = prices.find((item) => item.label === priceLabel);

  return restaurants.filter((restaurant) => {
    const areaOk = area === "어디든" || restaurant.area === area;
    const foodOk = food === "아무거나" || restaurant.category === food;
    const priceOk = price?.max == null || restaurant.priceTier <= price.max;
    return areaOk && foodOk && priceOk;
  });
}

function pickRandom(list: Restaurant[], currentId?: number) {
  const candidates =
    currentId != null && list.length > 1
      ? list.filter((restaurant) => restaurant.id !== currentId)
      : list;

  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index];
}

function formatPrice(price: number) {
  return `${price.toLocaleString("ko-KR")}원`;
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="이전으로"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-sand text-foreground shadow-[0_6px_18px_rgba(70,48,24,0.06)]"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path
          d="M11.2 3.8 6.1 9l5.1 5.2"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function Progress({ index }: { index: number }) {
  return (
    <div className="flex gap-1.5" aria-hidden="true">
      {[0, 1, 2].map((item) => (
        <span
          key={item}
          className={`h-1 flex-1 rounded-full ${item <= index ? "bg-coral" : "bg-line"}`}
        />
      ))}
    </div>
  );
}

function ChoiceRow({
  emoji,
  title,
  hint,
  selected,
  soft,
  onClick,
}: {
  emoji: string;
  title: string;
  hint: string;
  selected: boolean;
  soft?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center gap-4 rounded-[22px] px-4 py-4 text-left shadow-[0_8px_28px_rgba(70,48,24,0.05)] ring-2 ring-inset transition active:scale-[0.985] ${
        selected
          ? "bg-[#fff4f1] ring-coral"
          : soft
            ? "bg-sea-soft ring-transparent"
            : "bg-sand ring-transparent"
      }`}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[24px]">
        {emoji}
      </span>
      <span className="min-w-0">
        <span className="block text-[17px] font-semibold tracking-[-0.03em]">{title}</span>
        <span className="mt-0.5 block text-[13px] text-muted">{hint}</span>
      </span>
    </button>
  );
}

export default function Home() {
  const [step, setStep] = useState<Step>("intro");
  const [area, setArea] = useState<AreaOption | null>(null);
  const [food, setFood] = useState<FoodOption | null>(null);
  const [price, setPrice] = useState<PriceOption | null>(null);
  const [result, setResult] = useState<Restaurant | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, result?.id]);

  function clearPending() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function advance(next: Step) {
    clearPending();
    timerRef.current = setTimeout(() => setStep(next), ADVANCE_MS);
  }

  function goBack() {
    clearPending();
    setStep((current) => {
      if (current === "area") return "intro";
      if (current === "food") return "area";
      if (current === "budget") return "food";
      if (current === "result") return "budget";
      return current;
    });
  }

  function restart() {
    clearPending();
    setArea(null);
    setFood(null);
    setPrice(null);
    setResult(null);
    setStep("intro");
  }

  function chooseArea(value: AreaOption) {
    setArea(value);
    advance("food");
  }

  function chooseFood(value: FoodOption) {
    setFood(value);
    advance("budget");
  }

  function choosePrice(value: PriceOption) {
    if (!area || !food) return;
    setPrice(value);
    const matches = getMatches(area, food, value);
    setResult(matches.length > 0 ? pickRandom(matches) : null);
    advance("result");
  }

  function recommendAgain() {
    if (!area || !food || !price || !result) return;
    const matches = getMatches(area, food, price);
    if (matches.length < 2) return;
    setResult(pickRandom(matches, result.id));
  }

  const matches = area && food && price ? getMatches(area, food, price) : [];
  const viewKey = step === "result" ? `result-${result?.id ?? "empty"}` : step;

  return (
    <main className="mx-auto w-full max-w-[440px] px-5 pb-14 pt-8 sm:pt-16">
      <div key={viewKey} className="step-enter">
        {step === "intro" ? (
          <section>
            <div className="relative h-16 w-16" aria-hidden="true">
              <span className="absolute inset-0 rounded-full bg-sea-soft" />
              <span className="absolute top-1 right-0 h-6 w-6 rounded-full bg-coral" />
              <span className="absolute bottom-2.5 left-2.5 h-3 w-9 rounded-full bg-sea/75" />
              <span className="absolute bottom-0.5 left-4 h-2 w-7 rounded-full bg-sea/35" />
            </div>
            <p className="mt-8 inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1 text-[12px] font-semibold tracking-[0.14em] text-sea shadow-[0_6px_18px_rgba(70,48,24,0.04)]">
              <span className="h-1.5 w-1.5 rounded-full bg-coral" />
              POHANG
            </p>
            <h1 className="mt-5 text-[2.15rem] leading-[1.28] font-semibold tracking-[-0.045em]">
              바다가 가까운 도시에서,
              <br />
              오늘은 뭘 먹을까요?
            </h1>
            <p className="mt-4 text-[16px] leading-7 text-muted">
              동네, 음식, 예산. 세 가지만 고르면 포항 골목의 식당을 한 곳 열어 드려요.
            </p>
            <ul className="mt-9 space-y-3">
              {[
                ["🌊", "영일대 바람처럼 가볍게"],
                ["🍽️", "포항에서 실제로 먹는 메뉴"],
                ["🎓", "한동대 학생의 오늘 한 끼"],
              ].map(([emoji, label]) => (
                <li
                  key={label}
                  className="flex items-center gap-4 rounded-[20px] bg-sand px-4 py-4 shadow-[0_8px_28px_rgba(70,48,24,0.04)]"
                >
                  <span className="text-[22px]" aria-hidden="true">
                    {emoji}
                  </span>
                  <span className="text-[15px] font-medium">{label}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setStep("area")}
              className="mt-8 h-14 w-full rounded-2xl bg-coral text-[16px] font-semibold text-white shadow-[0_12px_28px_rgba(240,113,98,0.28)] transition active:bg-coral-deep"
            >
              한 끼 고르기
            </button>
            <p className="mt-5 text-center text-[12px] tracking-[0.04em] text-muted">
              오늘 뭐 먹지 · 포항
            </p>
          </section>
        ) : null}

        {step === "area" ? (
          <section>
            <div className="grid grid-cols-[40px_1fr_40px] items-center gap-3">
              <BackButton onClick={goBack} />
              <Progress index={0} />
              <span />
            </div>
            <p className="mt-10 text-[13px] font-semibold text-coral">1 / 3</p>
            <h1 className="mt-2 text-[1.9rem] leading-[1.3] font-semibold tracking-[-0.04em]">
              어디쯤에서 먹을까요?
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              가까운 동네를 하나 골라 주세요.
            </p>
            <div className="mt-8 space-y-3">
              {areas.map((item) => (
                <ChoiceRow
                  key={item.value}
                  emoji={item.emoji}
                  title={item.value}
                  hint={item.hint}
                  selected={area === item.value}
                  soft={item.value === "어디든"}
                  onClick={() => chooseArea(item.value)}
                />
              ))}
            </div>
          </section>
        ) : null}

        {step === "food" ? (
          <section>
            <div className="grid grid-cols-[40px_1fr_40px] items-center gap-3">
              <BackButton onClick={goBack} />
              <Progress index={1} />
              <span />
            </div>
            <p className="mt-10 text-[13px] font-semibold text-coral">2 / 3</p>
            <h1 className="mt-2 text-[1.9rem] leading-[1.3] font-semibold tracking-[-0.04em]">
              지금 당기는 맛은요?
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              오늘의 기분에 가까운 음식을 골라 주세요.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {foods.map((item) => {
                const wide = item.value === "아무거나";
                const selected = food === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => chooseFood(item.value)}
                    aria-pressed={selected}
                    className={`rounded-[22px] px-4 py-5 text-left shadow-[0_8px_28px_rgba(70,48,24,0.05)] ring-2 ring-inset transition active:scale-[0.985] ${
                      wide ? "col-span-2 flex items-center gap-4" : "min-h-[132px]"
                    } ${
                      selected
                        ? "bg-[#fff4f1] ring-coral"
                        : wide
                          ? "bg-sea-soft ring-transparent"
                          : "bg-sand ring-transparent"
                    }`}
                  >
                    <span className={`block leading-none ${wide ? "text-[32px]" : "text-[34px]"}`}>
                      {item.emoji}
                    </span>
                    <span className={wide ? "" : "mt-4 block"}>
                      <span className="block text-[16px] font-semibold tracking-[-0.03em]">
                        {item.value}
                      </span>
                      <span className="mt-1 block text-[13px] text-muted">{item.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {step === "budget" ? (
          <section>
            <div className="grid grid-cols-[40px_1fr_40px] items-center gap-3">
              <BackButton onClick={goBack} />
              <Progress index={2} />
              <span />
            </div>
            <p className="mt-10 text-[13px] font-semibold text-coral">3 / 3</p>
            <h1 className="mt-2 text-[1.9rem] leading-[1.3] font-semibold tracking-[-0.04em]">
              한 끼 예산은 어느 쪽인가요?
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              편하게 쓸 수 있는 만큼만 알려 주세요.
            </p>
            <div className="mt-8 space-y-3">
              {prices.map((item) => (
                <ChoiceRow
                  key={item.label}
                  emoji={item.emoji}
                  title={item.title}
                  hint={`${item.hint} · ${item.label}`}
                  selected={price === item.label}
                  soft={item.label === "상관없음"}
                  onClick={() => choosePrice(item.label)}
                />
              ))}
            </div>
          </section>
        ) : null}

        {step === "result" && result ? (
          <section>
            <div className="grid grid-cols-[40px_1fr_40px] items-center gap-3">
              <BackButton onClick={goBack} />
              <p className="text-center text-[13px] font-semibold tracking-[-0.02em]">
                오늘 뭐 먹지
              </p>
              <span />
            </div>
            <p className="mt-8 text-[13px] font-semibold text-sea">오늘의 한 끼</p>
            <p className="mt-2 text-[14px] text-muted">
              {area} · {food} · {price}
            </p>
            <article className="mt-4 overflow-hidden rounded-[28px] bg-sand shadow-[0_18px_50px_rgba(70,48,24,0.1)]">
              <div className="relative h-[420px]">
                <Image
                  src={result.image}
                  alt={result.imageAlt}
                  fill
                  priority
                  sizes="(max-width: 480px) 100vw, 440px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/15" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <p className="text-[13px] font-medium text-white/80">
                    {area ? areaLine[area] : "오늘의 한 끼"}
                  </p>
                  <h1 className="mt-1 text-[2rem] leading-tight font-semibold tracking-[-0.04em]">
                    {result.name}
                  </h1>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[result.area, result.category, `${formatPrice(result.priceTier)} 이하`].map(
                      (chip) => (
                        <span
                          key={chip}
                          className="rounded-full bg-white/20 px-2.5 py-1 text-[12px] font-medium backdrop-blur-sm"
                        >
                          {chip}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              </div>
              <div className="px-6 py-6">
                <p className="text-[17px] leading-7 font-medium tracking-[-0.02em]">
                  {result.description}
                </p>
                <div className="mt-5 rounded-[20px] bg-background px-4 py-4">
                  <p className="text-[12px] font-semibold tracking-[0.04em] text-sea">대표 메뉴</p>
                  <div className="mt-1 flex items-end justify-between gap-3">
                    <p className="text-[17px] font-semibold tracking-[-0.03em]">
                      {result.representativeMenu}
                    </p>
                    <p className="shrink-0 text-[17px] font-semibold text-coral">
                      {formatPrice(result.representativePrice)}
                    </p>
                  </div>
                  <p className="mt-1 text-[13px] text-muted">{result.priceBasis}</p>
                </div>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {result.situation.map((item) => (
                    <li
                      key={item}
                      className="rounded-full bg-sea-soft px-2.5 py-1 text-[12px] font-medium text-sea"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
            <div className="mt-5 space-y-2">
              {matches.length > 1 ? (
                <button
                  type="button"
                  onClick={recommendAgain}
                  className="h-14 w-full rounded-2xl bg-coral text-[16px] font-semibold text-white shadow-[0_12px_28px_rgba(240,113,98,0.28)] transition active:bg-coral-deep"
                >
                  다른 곳도 볼래요
                </button>
              ) : (
                <p className="py-2 text-center text-[14px] text-muted">
                  이 조건에서는 이곳이 오늘의 한 끼예요.
                </p>
              )}
              <button
                type="button"
                onClick={restart}
                className="h-12 w-full rounded-2xl text-[15px] font-semibold text-sea"
              >
                질문을 다시 할래요
              </button>
            </div>
          </section>
        ) : null}

        {step === "result" && !result ? (
          <section>
            <div className="grid grid-cols-[40px_1fr_40px] items-center gap-3">
              <BackButton onClick={goBack} />
              <p className="text-center text-[13px] font-semibold tracking-[-0.02em]">
                오늘 뭐 먹지
              </p>
              <span />
            </div>
            <div className="mt-8 rounded-[28px] bg-sand px-6 py-12 text-center shadow-[0_18px_50px_rgba(70,48,24,0.08)]">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sea-soft text-[30px]">
                🌊
              </div>
              <h1 className="mt-5 text-[1.6rem] leading-snug font-semibold tracking-[-0.04em]">
                이 마음은 조금 더
                <br />
                넓혀 볼까요?
              </h1>
              <p className="mt-3 text-[15px] leading-7 text-muted">
                동네나 예산을 한 칸만 열면, 다른 한 끼가 기다려요.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                clearPending();
                setStep("area");
              }}
              className="mt-5 h-14 w-full rounded-2xl bg-coral text-[16px] font-semibold text-white shadow-[0_12px_28px_rgba(240,113,98,0.28)] transition active:bg-coral-deep"
            >
              동네부터 다시 고르기
            </button>
            <button
              type="button"
              onClick={restart}
              className="mt-2 h-12 w-full rounded-2xl text-[15px] font-semibold text-sea"
            >
              처음으로
            </button>
          </section>
        ) : null}
      </div>
    </main>
  );
}
