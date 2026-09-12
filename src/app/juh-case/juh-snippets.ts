// Verbatim excerpts from the JUH source, checked on 2026-09-10.
export const JUH_SNIPPETS = {
  "signals": "private readonly itemsSignal = signal<CartItem[]>(this.restore());\n  readonly items = this.itemsSignal.asReadonly();\n  readonly totalItems = computed(() => this.items().reduce((sum, item) => sum + item.quantity, 0));\n  readonly total = computed(() =>\n    this.items().reduce((sum, item) => sum + item.product.price * item.quantity, 0),\n  );",
  "variant": "private sameVariant(a: CartItem, b: CartItem): boolean {\n    return a.product.id === b.product.id && a.size === b.size && a.color === b.color;\n  }",
  "form": "readonly form = inject(FormBuilder).nonNullable.group({\n    name: ['', [Validators.required, Validators.pattern(/\\S/)]],\n    email: ['', [Validators.required, Validators.email]],\n    address: ['', [Validators.required, Validators.pattern(/\\S/)]],\n    postalCode: ['', [Validators.required, Validators.pattern(/^\\d{4}-\\d{3}$/)]],\n    city: ['', [Validators.required, Validators.pattern(/\\S/)]],\n  });"
} as const;
