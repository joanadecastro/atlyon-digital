import { AfterViewInit, Component, HostListener, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import emailjs from '@emailjs/browser';
import { ProjectCaseComponent } from './project-case/project-case';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ProjectCaseComponent, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, AfterViewInit {
  selectedProject: any = null;
  selectedService: any = null;

  isScrolled = false;
  activeSection = '';
  isMenuOpen = false;

  isSubmitting = false;
  formSuccess = '';
  formError = '';

  private revealObserver?: IntersectionObserver;
  private sheetScrollY = 0;

  private readonly emailServiceId = 'service_jr984oj';
  private readonly emailTemplateId = 'template_7zyvxhl';
  private readonly emailPublicKey = 'uqQfbOsl3Txg0y5rt';

  ngOnInit() {
    emailjs.init(this.emailPublicKey);
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.isScrolled = window.scrollY > 40;
    this.updateActiveSection();

    if (this.isMenuOpen) {
      this.closeMenu();
    }
  }

  @HostListener('window:resize')
  onWindowResize() {
    if (window.innerWidth > 950 && this.isMenuOpen) {
      this.closeMenu();
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  services = [
    {
      title: 'Logótipo',
      description:
        'Criação de logótipos profissionais com versões adaptadas para diferentes suportes digitais e impressos.',
      priceLabel: 'Desde 249€',
    },
    {
      title: 'Branding',
      description:
        'Identidade visual completa com logótipo, cores, tipografia, direção visual e guia básico de marca.',
      priceLabel: 'Desde 599€',
    },
    {
      title: 'Websites',
      description:
        'Landing pages e websites empresariais modernos, responsivos e focados em credibilidade e conversão.',
      priceLabel: 'Desde 499€',
    },
    {
      title: 'Lojas online',
      description:
        'E-commerce personalizado com catálogo, produtos, pagamentos, encomendas e estrutura otimizada para vendas online.',
      priceLabel: 'Desde 1499€',
    },
    {
      title: 'Soluções digitais',
      description:
        'Áreas reservadas, dashboards, portais de cliente, sistemas internos e funcionalidades à medida.',
      priceLabel: 'Desde 1499€',
    },
    {
      title: 'Prestação de serviços',
      description:
        'Colaboração contínua ou por projeto em design, branding, UI/UX, frontend, backend e desenvolvimento de soluções digitais para empresas.',
      priceLabel: 'Sob orçamento',
    },
  ];

  processSteps = [
    {
      number: '01',
      title: 'Briefing',
      description:
        'Percebemos o negócio, objetivos, público, necessidades e tipo de solução pretendida.',
    },
    {
      number: '02',
      title: 'Direção e proposta',
      description:
        'Definimos a abordagem visual, técnica e comercial antes de avançar para a criação.',
    },
    {
      number: '03',
      title: 'Design e desenvolvimento',
      description:
        'Criamos a identidade, interface, website ou solução digital com foco em qualidade e funcionalidade.',
    },
    {
      number: '04',
      title: 'Entrega e lançamento',
      description:
        'Finalizamos os detalhes, publicamos o projeto e deixamos tudo pronto para ser usado.',
    },
  ];

  projects = [
    {
      name: 'LicitaNow',
      category: 'Plataforma Digital',
      description:
        'Website institucional para plataforma de licitações, com apresentação clara de serviços, proposta de valor e navegação profissional.',
      desktop: 'projects/licita_desktop.png',
      mobile: 'projects/licita_desktop.png',
      study: 'projects/licita_desktop.png',
      background: 'projects/licita_background.jpg',
      caseVideo: 'projects/licitanow-demo.mp4',
      hideMobileMockup: true,
      caseTitle: 'Licitações com Presença Digital',
      caseText:
        'A landing page foi concebida para transmitir uma imagem forte, moderna e profissional através de uma linguagem visual minimalista e de elevado contraste. A combinação entre tons escuros e apontamentos em verde foi utilizada para reforçar a identidade da marca, criar destaque visual e conduzir naturalmente a atenção do utilizador pelos elementos mais importantes da página. Toda a estrutura foi desenhada com foco na clareza da informação e na fluidez da navegação. A hierarquia visual, a gestão do espaço e a organização do conteúdo permitem uma leitura intuitiva, facilitando a compreensão da mensagem desde o primeiro contacto.',
      caseText2:
        'O design privilegia uma estética contemporânea, com elementos visuais limpos, tipografia impactante e uma composição equilibrada entre conteúdo e componentes gráficos. Cada secção foi construída para reforçar a credibilidade da marca e criar uma experiência consistente em diferentes dispositivos. O resultado é uma landing page sólida, visualmente marcante e alinhada com uma abordagem digital moderna, onde identidade, legibilidade e experiência de utilização trabalham em conjunto para criar uma presença online diferenciadora.',
      primaryFont: 'Inter',
      secondaryFont: 'Inter',
      accent: '#92c900',
      bg: '#07120d',
      surface: '#101c16',
      colors: [
        { name: 'Verde LicitaNow', hex: '#92c900', role: 'Accent' },
        { name: 'Verde Escuro', hex: '#07120d', role: 'Base' },
        { name: 'Grafite Digital', hex: '#101c16', role: 'Surface' },
      ],
    },
    {
      name: 'O Mercado Bistro',
      category: 'Restaurante',
      description:
        'Website elegante para restaurante, com menu, reservas, galeria e localização.',
      desktop: 'projects/restaurantedesktop.jpg',
      mobile: 'projects/restaurantemobile.jpg',
      study: 'projects/mercado_bistro_study.png',
      background: 'projects/restaurante_background.jpg',
      caseTitle: 'Sabor com Presença',
      caseText:
        'O Mercado Bistro foi pensado para comunicar uma experiência gastronómica acolhedora e elegante.',
      caseText2:
        'A direção visual combina fotografia gastronómica, tons quentes e hierarquia forte.',
      primaryFont: 'Inter',
      secondaryFont: 'Inter',
      accent: '#d96b2b',
      bg: '#100c09',
      surface: '#1b1410',
      colors: [
        { name: 'Noite', hex: '#100c09', role: 'Base' },
        { name: 'Terracota', hex: '#d96b2b', role: 'Accent' },
        { name: 'Creme', hex: '#f3e6d0', role: 'Light' },
      ],
    },
    {
      name: 'Atlantic Suites',
      category: 'Alojamento Local',
      description:
        'Website para alojamento premium, com suites, experiências, reservas e contacto.',
      desktop: 'projects/hoteldesktop.jpg',
      mobile: 'projects/hotelmobile.jpg',
      study: 'projects/atlantic_suites_study.png',
      background: 'projects/hotel_background.jpg',
      caseTitle: 'Luxo Costeiro Redefinido',
      caseText:
        'Atlantic Suites nasceu como uma experiência digital premium para alojamento costeiro.',
      caseText2:
        'A direção visual combina azul atlântico, tons claros e espaços amplos.',
      primaryFont: 'Playfair Display',
      secondaryFont: 'Inter',
      accent: '#0b4f63',
      bg: '#f4f7f8',
      surface: '#ffffff',
      text: '#12343b',
      colors: [
        { name: 'Azul Atlântico', hex: '#0b4f63', role: 'Primary' },
        { name: 'Areia Suave', hex: '#d8c3a5', role: 'Accent' },
        { name: 'Branco Puro', hex: '#f8f8f5', role: 'Surface' },
      ],
    },
  ];

  ngAfterViewInit() {
    this.onWindowScroll();
    this.preloadProjectImages();
    this.initRevealAnimations();
  }

  async sendProposal(form: NgForm) {
    this.formSuccess = '';
    this.formError = '';

    if (form.invalid) {
      this.formError = 'Preenche os campos obrigatórios antes de enviar.';
      return;
    }

    if (form.value.website) {
      return;
    }

    this.isSubmitting = true;

    const templateParams = {
      name: form.value.nome,
      company: form.value.empresa || 'Não indicado',
      email: form.value.email,
      phone: form.value.telefone || 'Não indicado',
      service: form.value.servico,
      message: form.value.mensagem,
    };

    try {
      await emailjs.send(
        this.emailServiceId,
        this.emailTemplateId,
        templateParams,
        {
          publicKey: this.emailPublicKey,
        }
      );

      this.formSuccess =
        'Pedido enviado com sucesso. Entraremos em contacto brevemente.';

      form.resetForm();
    } catch (error) {
      console.error('EmailJS Error:', error);

      this.formError =
        'Não foi possível enviar o pedido. Tenta novamente ou contacta-nos por email.';
    } finally {
      this.isSubmitting = false;
    }
  }

  updateActiveSection() {
    const sections = ['servicos', 'portfolio', 'processo', 'contacto'];

    for (const section of sections) {
      const element = document.getElementById(section);
      if (!element) continue;

      const rect = element.getBoundingClientRect();

      if (rect.top <= 170 && rect.bottom >= 170) {
        this.activeSection = section;
        return;
      }
    }

    this.activeSection = '';
  }

  preloadProjectImages() {
    this.projects.forEach((project) => {
      [
        project.desktop,
        project.mobile,
        project.study,
        project.background,
      ].forEach((src) => {
        if (!src) return;

        const img = new Image();
        img.decoding = 'async';
        img.src = src;
      });
    });
  }

  initRevealAnimations() {
    this.revealObserver?.disconnect();

    setTimeout(() => {
      const elements = document.querySelectorAll('.reveal-card, .reveal-phone');

      this.revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
            } else {
              entry.target.classList.remove('is-visible');
            }
          });
        },
        {
          threshold: 0.12,
          rootMargin: '0px 0px -40px 0px',
        }
      );

      elements.forEach((el) => {
        this.revealObserver?.observe(el);
      });
    }, 100);
  }

  openProject(project: any) {
    this.closeMenu();
    this.selectedProject = project;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'auto',
        });
      });
    });
  }

  closeProject() {
    this.selectedProject = null;

    setTimeout(() => {
      document
        .getElementById('portfolio')
        ?.scrollIntoView({ behavior: 'smooth' });

      this.preloadProjectImages();
      this.initRevealAnimations();
      this.onWindowScroll();
    }, 100);
  }

  scrollTop() {
    this.closeMenu();

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  openService(service: any) {
    this.selectedService = service;
    this.closeMenu();

    if (window.innerWidth <= 820) {
      this.sheetScrollY = window.scrollY;

      document.documentElement.classList.add('sheet-open');
      document.body.classList.add('sheet-open');
      document.body.style.top = `-${this.sheetScrollY}px`;
    }
  }

  closeService() {
    const wasSheetOpen = document.body.classList.contains('sheet-open');

    this.selectedService = null;

    document.documentElement.classList.remove('sheet-open');
    document.body.classList.remove('sheet-open');
    document.body.style.top = '';

    if (wasSheetOpen) {
      window.scrollTo(0, this.sheetScrollY);
    }
  }
}
