# Omi UI hackathon
#
#   make <prototype>        serve it            e.g. make threshold
#   make shot-<prototype>   screenshot it       e.g. make shot-threshold
#   make new NAME=<name>    scaffold a new one
#   make                    list prototypes
#
# Any prototype directory is a target by name. Nothing needs registering here
# when you add one.

# `$(wildcard prototypes/*/)` also matches plain files on make 3.81, which ships
# with macOS, so the directory test is done by find instead.
PROTOTYPES := $(shell find prototypes -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | sort)
CONCEPTS   := $(filter-out _%,$(PROTOTYPES))
PACK       := reference/hackathon-pack
TSC        := $(PACK)/node_modules/.bin/tsc

.DEFAULT_GOAL := list

# ---------------------------------------------------------------------------

.PHONY: list
list:
	@echo "Prototypes:"
	@$(foreach p,$(CONCEPTS),echo "  make $(p)";)
	@echo ""
	@echo "  make shot-<name>     screenshot to prototypes/<name>/screenshot.png"
	@echo "  make new NAME=<name> scaffold from _template"
	@echo "  make typecheck       tsc across all prototypes"

.PHONY: install
install: $(PACK)/node_modules

$(PACK)/node_modules: $(PACK)/package.json
	cd $(PACK) && npm install
	@touch $@

.PHONY: typecheck
typecheck: install
	@$(TSC) -p prototypes && echo "typecheck ok"

.PHONY: new
new:
	@test -n "$(NAME)" || { echo "Usage: make new NAME=<kebab-name>" >&2; exit 1; }
	@./scripts/new-prototype.sh $(NAME)

.PHONY: test
test: install
	cd $(PACK) && npm test

.PHONY: pages
pages: install
	@./scripts/build-pages.sh

.PHONY: clean
clean:
	rm -rf prototypes/*/.vite dist

# ---------------------------------------------------------------------------
# Serve and screenshot any prototype by name.
#
# `%: ` matches anything, so real targets above must be declared before it —
# make prefers an explicit rule over a pattern rule. The empty `Makefile:` rule
# stops make trying to rebuild this file through the same pattern.

Makefile: ;

.PHONY: $(CONCEPTS)
$(CONCEPTS): install
	@./scripts/serve-prototype.sh $@

shot-%: install
	@./scripts/screenshot-prototype.sh $*

# A name that is not a prototype should say so rather than "no rule to make".
%:
	@echo "Unknown prototype: $@" >&2
	@echo "Run 'make' to list them, or 'make new NAME=$@' to scaffold it." >&2
	@exit 1
