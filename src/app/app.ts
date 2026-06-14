import { AfterViewInit, Component, HostListener } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import emailjs from '@emailjs/browser';
import { ProjectCaseComponent } from './project-case/project-case';

@Component({
  selector: 'app-root',
  imports: [ProjectCaseComponent, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements AfterViewInit {
  selectedProject: any = null;
  isScrolled = false;
  activeSection = '';

  isSubmitting = false;
  formSuccess = '';
  formError = '';

  private revealObserver?: IntersectionObserver;

  private readonly emailServiceId = 'YOUR_SERVICE_ID';
  private readonly emailTemplateId = 'YOUR_TEMPLATE_ID';
  private readonly emailPublicKey = 'YOUR_PUBLIC_KEY';

  @HostListener('window:scroll')
  onWindowScroll() {
    this.isScrolled = window.scrollY > 40;
    this.updateActiveSection();
  }

  services = [
    {
      title: 'Branding e identidade visual',
      description:
        'Criação de logótipos, paletas de cor, tipografia, direção visual e sistemas de marca consistentes.',
      price: 250,
    },
    {
      title: 'Web design e desenvolvimento',
      description:
        'Websites modernos, responsivos e funcionais, pensados para apresentar a marca e gerar contactos.',
      price: 450,
    },
    {
      title: 'Design gráfico e packaging',
      description:
        'Materiais gráficos, embalagens, layouts, peças digitais e comunicação visual para diferentes suportes.',
      price: 180,
    },
    {
      title: 'Estratégia digital',
      description:
        'Organização da presença online, estrutura de conteúdos e soluções visuais para marcas crescerem com clareza.',
      price: 150,
    },
  ];

  processSteps = [
    {
      number: '01',
      title: 'Briefing',
      description:
        'Percebemos o negócio, objetivos, público e estilo visual pretendido.',
    },
    {
      number: '02',
      title: 'Direção visual',
      description:
        'Criamos uma linguagem gráfica alinhada com a personalidade da marca.',
    },
    {
      number: '03',
      title: 'Design e desenvolvimento',
      description:
        'Transformamos a ideia em peças visuais, website ou experiência digital funcional.',
    },
    {
      number: '04',
      title: 'Entrega e lançamento',
      description:
        'Preparamos os ficheiros finais, publicamos o site e deixamos tudo pronto a usar.',
    },
  ];

  projects = [
    {
      name: 'Barber House',
      category: 'Barbearia Premium',
      description:
        'Website premium para barbearia, com serviços, marcações, galeria e tabela de preços.',
      desktop: 'projects/barberdesktop.png',
      mobile: 'projects/barbermobile.png',
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
      desktop: 'projects/restaurantedesktop.png',
      mobile: 'projects/restaurantemobile.png',
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
      desktop: 'projects/hoteldesktop.png',
      mobile: 'projects/hotelmobile.png',
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
      nome: form.value.nome,
      empresa: form.value.empresa || 'Não indicado',
      email: form.value.email,
      telefone: form.value.telefone || 'Não indicado',
      servico: form.value.servico,
      mensagem: form.value.mensagem,
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
      console.error(error);
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