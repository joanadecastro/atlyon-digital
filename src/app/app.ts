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
  isScrolled = false;
  activeSection = '';

  isSubmitting = false;
  formSuccess = '';
  formError = '';

  private revealObserver?: IntersectionObserver;

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
      name: 'Barber House',
      category: 'Barbearia Premium',
      description:
        'Website premium para barbearia, com serviços, marcações, galeria e tabela de preços.',
      desktop: 'projects/barberdesktop.jpg',
      mobile: 'projects/barbermobile.jpg',
      study: 'projects/barber_house_study.png',
      background: 'projects/barbearia_background.jpg',
      caseTitle: 'Centenário de Elegância',
      caseText:
        'A Barber House Porto nasceu como uma barbearia premium, com uma estética clássica inspirada no coração do Porto.',
      caseText2:
        'Desenvolvemos uma linguagem visual elegante, focada em confiança, tradição e perceção de valor.',
      primaryFont: 'Inter',
      secondaryFont: 'Inter',
      accent: '#e9c349',
      bg: '#111111',
      surface: '#1d1c1b',
      colors: [
        { name: 'Obsidiana', hex: '#101010', role: 'Base' },
        { name: 'Ouro Porto', hex: '#e9c349', role: 'Accent' },
        { name: 'Carvão', hex: '#1b1b1b', role: 'Surface' },
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
    this.selectedProject = project;

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
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
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
}