import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { SearchInput } from "@/components/shared/search-input";

describe("SearchInput", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces input by default 300ms", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();

    render(<SearchInput onChange={onChange} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test" } });

    // Should not have called onChange yet (within debounce)
    expect(onChange).not.toHaveBeenCalled();

    // Advance past debounce
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onChange).toHaveBeenCalledWith("test");
  });

  it("calls onChange after debounce", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();

    render(<SearchInput onChange={onChange} debounceMs={100} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "a" } });

    act(() => {
      vi.advanceTimersByTime(50);
    });

    fireEvent.change(input, { target: { value: "ab" } });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should only fire once with final value
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("ab");
  });

  it("shows placeholder text", () => {
    render(<SearchInput onChange={vi.fn()} placeholder="Find projects..." />);
    expect(screen.getByPlaceholderText("Find projects...")).toBeInTheDocument();
  });
});
